class COSDataManager {
    static async saveToServer(experimentType, data) {
        try {
            console.log('开始保存数据:', experimentType);
            console.log('数据内容:', data);
            
            // 获取被试信息
            const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
            
            // 根据年级确定子文件夹
            const gradeFolder = `grade${participantInfo.grade}`;
            
            // 生成文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${experimentType}/${gradeFolder}/${participantInfo.name}_${timestamp}.csv`;
            
            console.log('保存文件到:', fileName);
            
            // 将数据转换为CSV
            const csvContent = this.convertToCSV(data);
            console.log('CSV内容:', csvContent);
            
            // 上传文件
            const signedUrl = COSConfig.getSignedUrl(fileName);
            console.log('上传URL:', signedUrl);
            
            const response = await fetch(signedUrl, {
                method: 'PUT',
                body: csvContent,
                headers: {
                    'Content-Type': 'text/csv'
                }
            });

            console.log('上传响应:', response);
            const responseText = await response.text();
            console.log('响应内容:', responseText);
            
            if (!response.ok) {
                throw new Error(`数据上传失败: ${response.status} - ${responseText}`);
            }

            // 同时保存本地备份
            this.saveLocally(experimentType, data);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            this.saveLocally(experimentType, data);
            return true;  // 继续实验
        }
    }

    static saveLocally(experimentType, data) {
        const downloadLink = document.createElement('a');
        const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
        
        // CSV文件
        const blob = new Blob([this.convertToCSV(data)], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        // 设置下载属性
        downloadLink.href = url;
        downloadLink.download = `${experimentType}_${participantInfo.name}_${new Date().toISOString()}.csv`;
        
        // 触发下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
    }

    static convertToCSV(data) {
        // 如果是SART任务的组合数据，分别处理performance和probes
        if (data.performance && data.probes) {
            // 确保两个数组都不为空
            const performanceData = data.performance.filter(item => item != null);
            const probesData = data.probes.filter(item => item != null);
            
            let csvContent = '';
            
            if (performanceData.length > 0) {
                const performanceCSV = this.arrayToCSV(data.performance);
                csvContent += `Performance Data:\n${performanceCSV}`;
            }
            
            if (probesData.length > 0) {
                const probesCSV = this.arrayToCSV(data.probes);
                if (csvContent) csvContent += '\n\n';
                csvContent += `Probe Data:\n${probesCSV}`;
            }
            
            return csvContent || 'No data available';
        }
        
        // 其他数据按原方式处理
        return this.arrayToCSV(Array.isArray(data) ? data : [data]);
    }

    static arrayToCSV(array) {
        if (!Array.isArray(array)) {
            array = [array];
        }
        
        // 过滤掉空值
        array = array.filter(item => item != null);
        
        // 如果数组为空，返回空字符串
        if (array.length === 0) {
            return '';
        }
        
        const headers = Object.keys(array[0]);
        const rows = array.map(row => headers.map(header => row[header]));
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    // 格式化不同类型的数据
    static formatVideoData(data) {
        return data.map(item => ({
            name: item.name,
            gender: item.gender,
            age: item.age,
            grade: item.grade,
            probeTime: item.probeTime,
            response: item.response
        }));
    }

    static formatSARTData(responses, mindWanderingResponses) {
        const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
        
        const sartResponses = responses
            .filter(r => !r.isPractice && !r.isProbe)
            .map(response => ({
                name: participantInfo.name,
                gender: participantInfo.gender,
                age: participantInfo.age,
                grade: participantInfo.grade,
                stimulus: response.stimulus,
                response: response.keyPressed ? '按键' : '未按键',
                correct: response.isCorrect ? 1 : 0,
                trial_timestamp: response.timestamp
            }));

        const probeResponses = mindWanderingResponses
            .filter(r => !r.isPractice)
            .map(response => ({
                name: participantInfo.name,
                gender: participantInfo.gender,
                age: participantInfo.age,
                grade: participantInfo.grade,
                trial: response.trial,
                timepoint: response.timepoint,
                response: response.response,
                trial_type: 'SART_Probe'
            }));

        return { sartResponses, mindWanderingResponses: probeResponses };
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
} 