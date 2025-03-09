document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const authButton = document.getElementById('authButton');
    const statusText = document.getElementById('statusText');
    const errorText = document.getElementById('errorText');
    const captureButton = document.getElementById('captureButton');
    const canvas = document.getElementById('canvas');
    const photo = document.getElementById('photo');
    const mergedCanvas = document.getElementById('mergedCanvas');
    const mergedPhoto = document.getElementById('mergedPhoto');
    const fileNameInput = document.getElementById('fileNameInput');
    const downloadButton = document.getElementById('downloadButton');
    const resetButton = document.getElementById('resetButton');

    let isInitializing = false;
    let photoCount = 0;
    let photoDataArray = [];

    // 添加新元素
    let timerContainer, timerSelect, countdownDisplay;
    let aspectRatioContainer, aspectRatioSelect;
    createTimerElements();
    createAspectRatioSelector();

    // 初始化检测
    checkCameraSupport();

    // 授权按钮点击事件
    authButton.addEventListener('click', handleAuthClick);

    // 拍照按钮点击事件
    captureButton.addEventListener('click', startTimedCapture);

    // 下载按钮点击事件
    downloadButton.addEventListener('click', downloadPhoto);

    // 重置按钮点击事件
    resetButton.addEventListener('click', resetPhotos);

    // 添加滤镜相关变量
    let currentFilter = 'normal';
    let backgroundColor = '#f5f5f7'; // 添加背景颜色变量，默认为浅灰色
    const filterOptions = [
        // 基础类优化
        { id: 'normal', name: '原图', apply: (ctx, imgData) => imgData },

        // 专业级单色滤镜
        {
            id: 'monochrome',
            name: '银盐',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
                    data[i] = gray * 1.2; // 增加对比度
                    data[i + 1] = gray * 1.2;
                    data[i + 2] = gray * 1.2;
                }
                return imgData;
            }
        },

        // 高级复合滤镜
        {
            id: 'vintage',
            name: '胶片',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 棕褐色调
                    data[i] = Math.min(255, (data[i] * 1.1) + 10);
                    data[i + 1] = Math.min(255, (data[i + 1] * 0.9) + 10);
                    data[i + 2] = Math.min(255, (data[i + 2] * 0.8));

                    // 增加对比度
                    data[i] = Math.min(255, data[i] * 1.1);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.1);
                }
                return imgData;
            }
        },

        {
            id: 'cinematic',
            name: '电影',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 增加对比度和饱和度
                    data[i] = Math.min(255, data[i] * 1.3);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1);
                    data[i + 2] = Math.min(255, data[i + 2] * 0.95);

                    // 降低亮度
                    data[i] = Math.max(0, data[i] * 0.95);
                    data[i + 1] = Math.max(0, data[i + 1] * 0.95);
                    data[i + 2] = Math.max(0, data[i + 2] * 0.95);
                }
                return imgData;
            }
        },

        // 现代流行风格
        {
            id: 'clarendon',
            name: '克莱顿',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 增加对比度和饱和度
                    data[i] = Math.min(255, data[i] * 1.2);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.2);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.8);

                    // 增加亮度
                    data[i] = Math.min(255, data[i] + 5);
                    data[i + 1] = Math.min(255, data[i + 1] + 5);
                    data[i + 2] = Math.min(255, data[i + 2] + 5);
                }
                return imgData;
            }
        },

        {
            id: 'juno',
            name: '朱诺',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 增加暖色调
                    data[i] = Math.min(255, data[i] * 1.1);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.4);
                    data[i + 2] = Math.min(255, data[i + 2] * 0.9);

                    // 增加对比度
                    data[i] = Math.min(255, data[i] * 1.1);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.1);
                }
                return imgData;
            }
        },

        // 环境光效优化
        {
            id: 'sunset',
            name: '黄昏',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 暖色调
                    data[i] = Math.min(255, data[i] * 1.3);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1);
                    data[i + 2] = Math.min(255, data[i + 2] * 0.8);

                    // 对比度
                    data[i] = Math.min(255, data[i] * 1.15);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.15);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.15);
                }
                return imgData;
            }
        },

        {
            id: 'moonlight',
            name: '月光',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 冷色调
                    data[i] = Math.min(255, data[i] * 0.8);
                    data[i + 1] = Math.min(255, data[i + 1] * 0.9);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2);

                    // 降低亮度
                    data[i] = Math.max(0, data[i] * 0.85);
                    data[i + 1] = Math.max(0, data[i + 1] * 0.85);
                    data[i + 2] = Math.max(0, data[i + 2] * 0.85);

                    // 增加对比度
                    data[i] = Math.min(255, data[i] * 1.25);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.25);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.25);
                }
                return imgData;
            }
        },

        // 特殊效果
        {
            id: 'soft-focus',
            name: '柔焦',
            apply: (ctx, imgData) => {
                // 柔焦效果需要在整个canvas层面实现，用简单的亮度和对比度处理代替
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 增加亮度
                    data[i] = Math.min(255, data[i] * 1.05);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.05);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.05);

                    // 降低对比度使画面更柔和
                    data[i] = 128 + (data[i] - 128) * 0.8;
                    data[i + 1] = 128 + (data[i + 1] - 128) * 0.8;
                    data[i + 2] = 128 + (data[i + 2] - 128) * 0.8;
                }
                return imgData;
            }
        },

        {
            id: 'dramatic',
            name: '戏剧',
            apply: (ctx, imgData) => {
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // 大幅增加对比度
                    data[i] = 128 + (data[i] - 128) * 2;
                    data[i + 1] = 128 + (data[i + 1] - 128) * 2;
                    data[i + 2] = 128 + (data[i + 2] - 128) * 2;

                    // 降低亮度
                    data[i] = Math.max(0, data[i] * 0.8);
                    data[i + 1] = Math.max(0, data[i + 1] * 0.8);
                    data[i + 2] = Math.max(0, data[i + 2] * 0.8);

                    // 增加饱和度
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = Math.min(255, avg + (data[i] - avg) * 1.5);
                    data[i + 1] = Math.min(255, avg + (data[i + 1] - avg) * 1.5);
                    data[i + 2] = Math.min(255, avg + (data[i + 2] - avg) * 1.5);
                }
                return imgData;
            }
        }
    ];

    async function checkCameraSupport() {
        try {
            const hasCamera = await checkCameraPermission();
            if (hasCamera) {
                await initCamera();
            }
        } catch (error) {
            handleInitError(error);
        }
    }

    async function checkCameraPermission() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(d => d.kind === 'videoinput');
        } catch (error) {
            console.error('设备枚举失败:', error);
            return false;
        }
    }

    async function handleAuthClick() {
        if (isInitializing) return;
        isInitializing = true;

        statusText.textContent = '正在请求摄像头权限...';
        errorText.style.display = 'none';
        authButton.disabled = true;

        try {
            await initCamera();
        } catch (error) {
            handleInitError(error);
        } finally {
            isInitializing = false;
            authButton.disabled = false;
        }
    }

    async function initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            handleSuccess(stream);
            return true;
        } catch (error) {
            handleInitError(error);
            return false;
        }
    }

    function handleSuccess(stream) {
        video.srcObject = stream;
        video.style.display = 'block';
        // 添加镜像效果
        video.style.transform = 'scaleX(-1)';
        authButton.style.display = 'none';
        captureButton.style.display = 'block';
        statusText.textContent = '摄像头已启用，请拍摄4张照片';
        errorText.style.display = 'none';
        resetButton.style.display = 'block';

        // 更新视频的初始尺寸比例
        updateVideoAspectRatio();

        stream.getVideoTracks()[0].addEventListener('ended', () => {
            showError('摄像头连接已断开');
            captureButton.style.display = 'none';
        });
    }

    function handleInitError(error) {
        console.error('摄像头错误:', error);

        if (error.name === 'NotAllowedError') {
            showAuthButton('需要摄像头权限才能继续');
        } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
            showError('未找到可用摄像头');
        } else {
            showError('摄像头初始化失败');
        }
    }

    function showAuthButton(message) {
        statusText.textContent = message;
        authButton.style.display = 'block';
        video.style.display = 'none';
    }

    function showError(message) {
        errorText.textContent = message;
        errorText.style.display = 'block';
        video.style.display = 'none';
        authButton.style.display = 'none';
        statusText.textContent = '';
    }

    // 创建延时元素
    function createTimerElements() {
        // 创建容器
        timerContainer = document.createElement('div');
        timerContainer.id = 'timerContainer';

        // 创建标签
        const label = document.createElement('span');
        label.className = 'timer-label';
        label.textContent = '延时时间(秒):';

        // 创建选择器
        timerSelect = document.createElement('select');
        timerSelect.id = 'timerSelect';

        // 添加选项 1-300
        for (let i = 1; i <= 300; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === 3) option.selected = true; // 默认3秒
            timerSelect.appendChild(option);
        }

        // 创建倒计时显示
        countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'countdownDisplay';

        // 组装元素
        timerContainer.appendChild(label);
        timerContainer.appendChild(timerSelect);

        // 添加到DOM
        captureButton.textContent = '开始'; // 将"拍照"改为"开始"
        captureButton.after(timerContainer);
        timerContainer.after(countdownDisplay);
    }

    // 创建尺寸比例选择器
    function createAspectRatioSelector() {
        // 创建容器
        aspectRatioContainer = document.createElement('div');
        aspectRatioContainer.id = 'aspectRatioContainer';
        aspectRatioContainer.className = 'aspect-ratio-container';

        // 创建标签
        const label = document.createElement('span');
        label.className = 'aspect-ratio-label';
        label.textContent = '照片尺寸:';

        // 创建选择器
        aspectRatioSelect = document.createElement('select');
        aspectRatioSelect.id = 'aspectRatioSelect';

        // 添加尺寸选项
        const aspectRatios = [
            { value: '4:3', text: '4:3 (标准)' },
            { value: '16:9', text: '16:9 (宽屏)' },
            { value: '9:16', text: '9:16 (手机竖屏)' }
        ];

        aspectRatios.forEach(ratio => {
            const option = document.createElement('option');
            option.value = ratio.value;
            option.textContent = ratio.text;
            aspectRatioSelect.appendChild(option);
        });

        // 组装元素
        aspectRatioContainer.appendChild(label);
        aspectRatioContainer.appendChild(aspectRatioSelect);

        // 添加到DOM - 放在延时选择器之后
        timerContainer.after(aspectRatioContainer);

        // 添加变化事件处理
        aspectRatioSelect.addEventListener('change', updateVideoAspectRatio);
    }

    // 更新视频显示尺寸比例
    function updateVideoAspectRatio() {
        if (!video.srcObject) return;

        const aspectRatio = aspectRatioSelect.value;
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

        // 设置视频容器的比例
        video.style.aspectRatio = `${widthRatio}/${heightRatio}`;

        // 如果是手机竖屏模式，调整对象适应方式
        if (aspectRatio === '9:16') {
            video.style.objectFit = 'cover';
        } else {
            video.style.objectFit = 'cover';
        }

        console.log(`尺寸比例已更新为: ${aspectRatio}`);
    }

    // 启动延时拍照
    function startTimedCapture() {
        if (!video.srcObject) {
            showError('摄像头未启用');
            return;
        }

        if (photoCount >= 4) {
            statusText.textContent = '已拍摄4张照片，请保存或重新拍摄';
            return;
        }

        // 隐藏开始按钮、计时器选择和尺寸选择
        captureButton.style.display = 'none';
        timerContainer.style.display = 'none';
        aspectRatioContainer.style.display = 'none';

        // 获取延时时间
        const delaySeconds = parseInt(timerSelect.value);

        // 显示倒计时
        countdownDisplay.style.display = 'block';

        // 开始倒计时并拍照
        takePhotoWithCountdown(delaySeconds);
    }

    // 倒计时拍照
    function takePhotoWithCountdown(seconds) {
        let remaining = seconds;

        // 确保倒计时显示是可见的
        countdownDisplay.style.display = 'block';

        // 更新倒计时显示
        countdownDisplay.textContent = `${remaining}`;

        const countdownInterval = setInterval(() => {
            remaining--;

            if (remaining <= 0) {
                clearInterval(countdownInterval);

                // 拍照
                takePhotoNow();

                // 如果还需要更多照片，继续倒计时拍摄
                if (photoCount < 4) {
                    setTimeout(() => {
                        takePhotoWithCountdown(seconds);
                    }, 500); // 短暂延迟后开始下一张
                } else {
                    // 全部拍完后，隐藏倒计时显示
                    countdownDisplay.style.display = 'none';

                    // 显示文件名输入框和下载按钮
                    fileNameInput.style.display = 'block';
                    downloadButton.style.display = 'block';
                }
            } else {
                countdownDisplay.textContent = `${remaining}`;
            }
        }, 1000);
    }

    // 实际拍照功能
    function takePhotoNow() {
        // 确定裁剪区域的尺寸和位置
        const aspectRatio = aspectRatioSelect.value;
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

        // 修改1: 使用裁剪区域的实际尺寸作为canvas尺寸
        const sourceWidth = Math.min(video.videoWidth, video.videoHeight * widthRatio / heightRatio);
        const sourceHeight = sourceWidth * heightRatio / widthRatio;

        canvas.width = sourceWidth;  // 直接使用裁剪尺寸
        canvas.height = sourceHeight;

        const context = canvas.getContext('2d');

        // 计算裁剪区域
        let sourceX = (video.videoWidth - sourceWidth) / 2;
        let sourceY = (video.videoHeight - sourceHeight) / 2;

        // 修改2: 1:1绘制裁剪区域到canvas
        context.save();
        context.scale(-1, 1); // 镜像处理
        context.drawImage(
            video,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            -canvas.width, // 由于镜像，X坐标取反
            0,
            canvas.width,
            canvas.height
        );
        context.restore();

        // 获取照片数据URL - 确保保存完整分辨率
        const photoData = canvas.toDataURL('image/png');
        photoDataArray.push(photoData);

        photoCount++;

        if (photoCount < 4) {
            statusText.textContent = `已拍摄${photoCount}张照片，还需${4 - photoCount}张`;
        } else {
            // 四张照片都拍完了，合并照片
            mergePhotos();
            statusText.textContent = '4张照片已拍摄完成，请设置文件名并保存';
            fileNameInput.style.display = 'block';
            downloadButton.style.display = 'block';
        }
    }

    function mergePhotos() {
        const imgPromises = photoDataArray.map(photoData => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ img, width: img.width, height: img.height });
                img.src = photoData;
            });
        });

        Promise.all(imgPromises).then(photos => {
            const padding = 20;
            const cornerRadius = 20;

            // 修改1: 计算实际最大宽度（不再强制统一宽度）
            const maxWidth = Math.max(...photos.map(p => p.width)) + (padding * 2);
            let totalHeight = padding;

            photos.forEach(photo => {
                totalHeight += photo.height + padding; // 保持每张照片原始高度
            });

            // 设置画布尺寸（宽度根据实际内容决定）
            mergedCanvas.width = maxWidth;
            mergedCanvas.height = totalHeight;

            const mCtx = mergedCanvas.getContext('2d');

            // 填充白色背景
            mCtx.fillStyle = 'white';
            mCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);

            // 绘制圆角矩形作为背景
            mCtx.fillStyle = backgroundColor;
            roundRect(mCtx, 0, 0, mergedCanvas.width, mergedCanvas.height, cornerRadius, true, false);

            // 修改2: 保持每张照片原始尺寸
            let currentY = padding;
            photos.forEach(photo => {
                const x = (maxWidth - photo.width) / 2; // 水平居中
                const y = currentY;

                // 绘制白色背景（使用实际尺寸）
                mCtx.fillStyle = '#ffffff';
                roundRect(mCtx, x, y, photo.width, photo.height, 12, true, false);

                // 绘制照片（保持原始尺寸）
                mCtx.save();
                roundRect(mCtx, x, y, photo.width, photo.height, 12, false, true);
                mCtx.clip();
                mCtx.drawImage(photo.img, x, y, photo.width, photo.height);
                mCtx.restore();

                currentY += photo.height + padding;
            });

            // 更新显示
            mergedPhoto.src = mergedCanvas.toDataURL('image/png');
            mergedPhoto.style.display = 'block';

            // 显示滤镜面板
            document.getElementById('filterPanel').style.display = 'block';

            // 应用当前选择的滤镜
            if (currentFilter !== 'normal') {
                applyFilterToPreview();
            }
        });
    }

    // 辅助函数：绘制圆角矩形
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        }

        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();

        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    // 创建滤镜选择界面
    function createFilterPanel() {
        const filterPanel = document.createElement('div');
        filterPanel.id = 'filterPanel';
        filterPanel.className = 'filter-panel';
        filterPanel.style.display = 'none';

        const filterTitle = document.createElement('h3');
        filterTitle.textContent = '选择滤镜';
        filterPanel.appendChild(filterTitle);

        const filterGrid = document.createElement('div');
        filterGrid.className = 'filter-grid';

        filterOptions.forEach(filter => {
            const filterItem = document.createElement('div');
            filterItem.className = 'filter-item';
            filterItem.dataset.filter = filter.id;

            // 删除预览图标部分，只保留文字
            const filterName = document.createElement('div');
            filterName.className = 'filter-name';
            filterName.textContent = filter.name;

            filterItem.appendChild(filterName);

            // 添加滤镜选择事件 - 同时支持点击和触摸
            filterItem.addEventListener('click', function (e) {
                e.preventDefault(); // 防止事件冒泡
                selectFilter(this, filter.id);
            });

            // 添加触摸支持
            filterItem.addEventListener('touchend', function (e) {
                e.preventDefault(); // 防止触摸事件转换为点击事件
                selectFilter(this, filter.id);
            }, false);

            filterGrid.appendChild(filterItem);
        });

        // 选择滤镜的辅助函数
        function selectFilter(element, filterId) {
            document.querySelectorAll('.filter-item').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');
            currentFilter = filterId;

            // 实时应用滤镜到预览图上
            applyFilterToPreview();
        }

        filterPanel.appendChild(filterGrid);

        // 添加背景颜色选择部分
        const colorSection = document.createElement('div');
        colorSection.className = 'color-section';

        const colorTitle = document.createElement('h3');
        colorTitle.textContent = '选择背景颜色';
        colorSection.appendChild(colorTitle);

        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.className = 'color-picker-container';
        colorPickerContainer.style.position = 'relative'; // 添加相对定位

        const colorPreview = document.createElement('div');
        colorPreview.className = 'color-preview';
        colorPreview.style.backgroundColor = backgroundColor;
        colorPreview.style.width = '40px';
        colorPreview.style.height = '40px';
        colorPreview.style.borderRadius = '50%';
        colorPreview.style.cursor = 'pointer';
        colorPreview.style.border = '2px solid #ccc';
        colorPreview.style.display = 'inline-block';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'backgroundColorPicker';
        colorInput.value = backgroundColor;
        // 改为绝对定位，覆盖在预览上
        colorInput.style.position = 'absolute';
        colorInput.style.opacity = '0';
        colorInput.style.left = '0';
        colorInput.style.top = '0';
        colorInput.style.width = '100%';
        colorInput.style.height = '100%';
        colorInput.style.cursor = 'pointer';

        // 颜色值显示
        const colorValueDisplay = document.createElement('span');
        colorValueDisplay.textContent = backgroundColor;
        colorValueDisplay.style.marginLeft = '10px';
        colorValueDisplay.style.display = 'inline-block';
        colorValueDisplay.style.verticalAlign = 'middle';

        // 处理颜色选择器的兼容性问题
        const handleColorChange = (e) => {
            backgroundColor = e.target.value;
            colorPreview.style.backgroundColor = backgroundColor;
            colorValueDisplay.textContent = backgroundColor;

            // 使用setTimeout确保UI更新后应用滤镜
            setTimeout(() => {
                // 保存当前滤镜设置
                const currentFilterSetting = currentFilter;

                // 重新生成带新背景的预览图
                applyFilterToPreview();

                console.log('背景色已更新:', backgroundColor);
            }, 50);
        };

        // 添加点击和触摸事件
        colorPreview.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('颜色预览被点击');
            colorInput.click();
        });

        colorPreview.addEventListener('touchend', (e) => {
            e.preventDefault();
            console.log('颜色预览被触摸');
            colorInput.click();
        }, false);

        colorInput.addEventListener('input', handleColorChange);
        colorInput.addEventListener('change', handleColorChange);

        colorPickerContainer.appendChild(colorPreview);
        colorPickerContainer.appendChild(colorInput);
        colorPickerContainer.appendChild(colorValueDisplay);
        colorSection.appendChild(colorPickerContainer);

        filterPanel.appendChild(colorSection);

        // 将滤镜面板添加到DOM
        const container = document.querySelector('.container');
        container.insertBefore(filterPanel, document.querySelector('.storage-container'));

        return filterPanel;
    }

    // 修改 applyFilterToPreview 函数，增加错误处理和日志
    function applyFilterToPreview() {
        if (photoCount < 4 || !mergedCanvas) {
            console.log('无法应用滤镜: 照片不足或画布未准备');
            return;
        }

        console.log('应用滤镜:', currentFilter, '背景色:', backgroundColor);

        // 先获取所有照片的实际尺寸
        const imgPromises = photoDataArray.map(photoData => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ img, width: img.width, height: img.height });
                img.src = photoData;
            });
        });

        Promise.all(imgPromises).then(photos => {
            const padding = 20;
            const cornerRadius = 20;

            // 使用实际最大宽度
            const maxWidth = Math.max(...photos.map(p => p.width)) + (padding * 2);
            let totalHeight = padding;

            photos.forEach(photo => {
                totalHeight += photo.height + padding;
            });

            // 创建预览画布
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = maxWidth;
            previewCanvas.height = totalHeight;
            const previewCtx = previewCanvas.getContext('2d');

            // 填充白色背景
            previewCtx.fillStyle = 'white';
            previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

            // 绘制背景色
            previewCtx.fillStyle = backgroundColor;
            roundRect(previewCtx, 0, 0, previewCanvas.width, previewCanvas.height, cornerRadius, true, false);

            // 获取选中的滤镜
            const selectedFilter = filterOptions.find(f => f.id === currentFilter);

            // 处理每张照片
            let currentY = padding;
            const processPromises = photos.map((photo, index) => {
                return new Promise(resolve => {
                    const width = photo.width;
                    const height = photo.height;
                    const x = (maxWidth - width) / 2; // 水平居中
                    const y = currentY;

                    // 创建临时canvas
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempCtx = tempCanvas.getContext('2d');

                    // 绘制原始照片
                    tempCtx.drawImage(photo.img, 0, 0, width, height);

                    // 应用滤镜
                    if (selectedFilter && selectedFilter.id !== 'normal') {
                        try {
                            let imgData = tempCtx.getImageData(0, 0, width, height);
                            imgData = selectedFilter.apply(tempCtx, imgData);
                            tempCtx.putImageData(imgData, 0, 0);
                        } catch (e) {
                            console.error('应用滤镜失败:', e);
                        }
                    }

                    // 绘制到预览画布
                    previewCtx.save();
                    roundRect(previewCtx, x, y, width, height, 12, false, true);
                    previewCtx.clip();
                    previewCtx.drawImage(tempCanvas, x, y);
                    previewCtx.restore();

                    currentY += height + padding;
                    resolve();
                });
            });

            // 所有照片处理完成后更新预览
            Promise.all(processPromises).then(() => {
                console.log('所有照片处理完成，更新预览图');
                mergedPhoto.src = previewCanvas.toDataURL('image/png');
            });
        });
    }

    function downloadPhoto() {
        if (photoCount < 4) {
            showError('请先拍摄4张照片');
            return;
        }

        // 获取用户输入的文件名
        let fileName = fileNameInput.value.trim();
        if (!fileName) {
            const now = new Date();
            fileName = `photobooth_${now.getTime()}`;
        }

        statusText.textContent = '处理中，请稍候...';

        // 先获取所有照片的实际尺寸
        const imgPromises = photoDataArray.map(photoData => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ img, width: img.width, height: img.height });
                img.src = photoData;
            });
        });

        Promise.all(imgPromises).then(photos => {
            const padding = 20;
            const cornerRadius = 20;

            // 使用实际最大宽度
            const maxWidth = Math.max(...photos.map(p => p.width)) + (padding * 2);
            let totalHeight = padding;

            photos.forEach(photo => {
                totalHeight += photo.height + padding;
            });

            // 创建最终画布
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = maxWidth;
            finalCanvas.height = totalHeight;
            const finalCtx = finalCanvas.getContext('2d');

            // 填充白色背景
            finalCtx.fillStyle = 'white';
            finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // 绘制背景色
            finalCtx.fillStyle = backgroundColor;
            roundRect(finalCtx, 0, 0, finalCanvas.width, finalCanvas.height, cornerRadius, true, false);

            // 获取选中的滤镜
            const selectedFilter = filterOptions.find(f => f.id === currentFilter);

            // 处理每张照片
            let currentY = padding;
            const processPromises = photos.map((photo, index) => {
                return new Promise(resolve => {
                    const width = photo.width;
                    const height = photo.height;
                    const x = (maxWidth - width) / 2; // 水平居中
                    const y = currentY;

                    // 创建临时canvas
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempCtx = tempCanvas.getContext('2d');

                    // 绘制原始照片
                    tempCtx.drawImage(photo.img, 0, 0, width, height);

                    // 应用滤镜
                    if (selectedFilter && selectedFilter.id !== 'normal') {
                        try {
                            let imgData = tempCtx.getImageData(0, 0, width, height);
                            imgData = selectedFilter.apply(tempCtx, imgData);
                            tempCtx.putImageData(imgData, 0, 0);
                        } catch (e) {
                            console.error('应用滤镜失败:', e);
                        }
                    }

                    // 绘制到最终画布
                    finalCtx.save();
                    roundRect(finalCtx, x, y, width, height, 12, false, true);
                    finalCtx.clip();
                    finalCtx.drawImage(tempCanvas, x, y);
                    finalCtx.restore();

                    currentY += height + padding;
                    resolve();
                });
            });

            // 所有照片处理完成后创建下载链接
            Promise.all(processPromises).then(() => {
                const downloadLink = document.createElement('a');
                downloadLink.href = finalCanvas.toDataURL('image/png');
                downloadLink.download = `${fileName}.png`;

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                statusText.textContent = '大头贴已保存';
            });
        });
    }

    function resetPhotos() {
        // 重置照片计数和数据
        photoCount = 0;
        photoDataArray = [];

        // 重置UI状态
        mergedPhoto.style.display = 'none';
        fileNameInput.style.display = 'none';
        downloadButton.style.display = 'none';
        countdownDisplay.style.display = 'none';

        // 显示开始按钮、延时选择和尺寸选择
        captureButton.style.display = 'block';
        timerContainer.style.display = 'flex';
        aspectRatioContainer.style.display = 'flex';

        if (video.srcObject) {
            statusText.textContent = '请拍摄4张照片';
        }

        // 隐藏滤镜面板
        document.getElementById('filterPanel').style.display = 'none';
    }

    // 页面可见性处理
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    });

    // 创建滤镜面板
    createFilterPanel();
});