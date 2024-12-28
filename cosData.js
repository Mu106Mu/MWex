class COSDataManager {
    static async saveToServer(experimentType, data) {
        try {
            // 获取被试信息
            const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
            
            // 生成文件名
            const fileName = `data/${experimentType}/${participantInfo.name}_${new Date().toISOString()}.csv`;
            
            // 将数据转换为CSV
            const csvContent = this.convertToCSV(data);
            
            // 获取上传授权
            const auth = await COSConfig.getUploadAuth(fileName);
            
            // 上传文件
            const response = await fetch(
                `https://mw-experiment-1333907144.cos.ap-guangzhou.myqcloud.com/${fileName}`,
                {
                    method: 'PUT',
                    body: csvContent,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Authorization': auth.authorization,
                        'x-cos-security-token': auth.sessionToken
                    }
                }
            );

            if (!response.ok) {
                throw new Error('数据上传失败');
            }

            // 同时保存本地备份
            this.saveLocally(experimentType, data);
            
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            // 保存失败时仍然保存本地备份
            this.saveLocally(experimentType, data);
            return false;
        }
    }

    static saveLocally(experimentType, data) {
        const downloadLink = document.createElement('a');
        const participantInfo = JSON.parse(localStorage.getItem('participantInfo'));
        
        // 创建CSV文件
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
        if (!Array.isArray(data)) {
            data = [data];
        }
        
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => row[header]));
        
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

    static formatSARTData(responses) {
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

        const probeResponses = responses
            .filter(r => r.isProbe)
            .map(response => ({
                name: participantInfo.name,
                gender: participantInfo.gender,
                age: participantInfo.age,
                grade: participantInfo.grade,
                probe_time: response.timestamp,
                response: response.probeResponse,
                trial_type: 'SART_Probe'
            }));

        return { sartResponses, probeResponses };
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