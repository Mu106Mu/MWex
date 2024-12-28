class DataManager {
    static initLeanCloud() {
        // 只初始化一次
        if (!DataManager.initialized) {
            // 确保 SDK 已加载
            if (typeof AV === 'undefined') {
                throw new Error('LeanCloud SDK 未加载，请检查网络连接');
            }
            
            try {
                AV.init({
                    appId: "Oq6gLma8on2P00Og3HpxHZYr-gzGzoHsz",
                    appKey: "8cD1EbahhUIrwtJvm7hNPrlL",
                    serverURL: "https://oq6glma8.lc-cn-n1-shared.com"
                });
                DataManager.initialized = true;
                console.log('LeanCloud 初始化成功');
                return true;  // 添加返回值表示初始化成功
            } catch (e) {
                console.warn('LeanCloud 初始化失败:', e);
                return false;  // 添加返回值表示初始化失败
            }
        }
        return DataManager.initialized;  // 返回初始化状态
    }

    static async saveToServer(experimentType, data) {
        try {
            const initialized = this.initLeanCloud();
            
            if (!initialized) {
                throw new Error('LeanCloud 未初始化');
            }

            console.log(`开始保存 ${experimentType} 数据:`, data);
            
            // 获取被试信息
            const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));

            if (Array.isArray(data) && data.length > 0) {
                // 将数据转换为CSV格式
                const csvContent = this.convertToCSV(data);
                
                // 创建文件对象
                const file = new AV.File(
                    `${experimentType}_${participantInfo.name}_${new Date().toISOString()}.csv`,
                    { base64: btoa(csvContent) }
                );
                
                // 保存文件
                try {
                    await file.save();
                    console.log(`${experimentType} CSV文件保存成功`);
                } catch (error) {
                    console.error('CSV文件保存失败，将保存到本地:', error);
                    this.saveLocally(experimentType, data);
                }
                // 无论是否保存成功，都下载本地备份
                this.saveLocally(experimentType, data);
            } else {
                // 如果是单个对象（比如记忆任务的结果），直接保存
                const ExperimentData = AV.Object.extend(experimentType);
                const experimentData = new ExperimentData();
                
                console.log('保存单个数据对象:', data);
                experimentData.set('timestamp', new Date().toISOString());
                Object.entries(data).forEach(([key, value]) => {
                    experimentData.set(key, value);
                });
                await experimentData.save();
            }
            
            console.log(`${experimentType} 数据保存成功`);
            
            // 标记任务完成
            try {
                const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');
                completedTasks[experimentType] = true;
                localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            } catch (e) {
                console.error('保存任务完成状态失败:', e);
            }
            
            return true;
        } catch (error) {
            console.error('服务器保存失败，详细错误:', error);
            this.saveLocally(experimentType, data);
            
            // 即使保存失败也标记任务为完成
            const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');
            completedTasks[experimentType] = true;
            localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        }
    }

    static saveLocally(experimentType, data) {
        // 创建一个隐藏的下载链接
        const downloadLink = document.createElement('a');
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        // 设置下载属性
        const blob = new Blob([this.convertToCSV(data)], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = `${experimentType}_${new Date().toISOString()}.csv`;
        
        // 触发下载
        downloadLink.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    static convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => row[header]));
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    static formatSARTData(responses) {
        const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
        // 分离按键反应数据和探针数据
        const sartResponses = responses
            .filter(r => !r.isPractice && !r.isProbe)  // 只保存正式实验的按键数据
            .map(response => ({
                name: participantInfo.name,
                gender: participantInfo.gender,
                age: participantInfo.age,
                grade: participantInfo.grade,
                stimulus: response.stimulus,
                response: response.keyPressed ? '按键' : '未按键',
                correct: response.isCorrect ? 1 : 0,
                trial_timestamp: response.timestamp || new Date().toISOString()
            }));

        // 处理探针数据
        const probeResponses = responses
            .filter(r => r.isProbe)  // 只保存探针数据
            .map(response => ({
                name: participantInfo.name,
                gender: participantInfo.gender,
                age: participantInfo.age,
                grade: participantInfo.grade,
                probe_time: response.timestamp,
                response: response.probeResponse,
                trial_type: 'SART_Probe',
                trial_timestamp: response.timestamp || new Date().toISOString()
            }));

        // 分别保存两种数据
        this.saveToServer('SART_Performance', sartResponses);
        this.saveToServer('SART_Probes', probeResponses);
    }

    static formatMemoryData(results) {
        const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
        return [{
            name: participantInfo.name,
            gender: participantInfo.gender,
            age: participantInfo.age,
            grade: participantInfo.grade,
            forward_span: results.forward,
            backward_span: results.backward,
            spatial_span: results.spatial
        }];
    }

    static formatVideoData(data) {
        // 格式化为指定的列顺序
        const formattedData = data.map(item => ({
            name: item.name,               // 被试姓名
            gender: item.gender,           // 性别
            age: item.age,                // 年龄
            grade: item.grade,            // 所在年级
            probeTime: item.probeTime,    // 选择题出现时间
            response: item.response       // 选项内容
        }));
        
        return formattedData;
    }

    static formatMindWanderingData(responses) {
        const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
        return responses.map(response => ({
            name: participantInfo.name,
            gender: participantInfo.gender,
            age: participantInfo.age,
            grade: participantInfo.grade,
            probe_time: response.timepoint,
            response: response.response
        }));
    }
} 