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
    createTimerElements();

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
        { id: 'normal', name: '原图', css: 'brightness(102%) contrast(102%)' }, // 微调提升画面通透感

        // 专业级单色滤镜
        { id: 'monochrome', name: '银盐', css: 'grayscale(100%) contrast(120%) brightness(98%)' }, // 模拟胶片黑白

        // 高级复合滤镜
        {
            id: 'vintage', name: '胶片', css:
                'sepia(40%) hue-rotate(-10deg) contrast(110%) saturate(120%) brightness(105%)'
        }, // 柯达胶片风格

        {
            id: 'cinematic', name: '电影', css:
                'contrast(130%) brightness(95%) saturate(110%) hue-rotate(5deg)'
        }, // 电影级调色

        // 现代流行风格
        {
            id: 'clarendon', name: '克莱顿', css:
                'contrast(120%) saturate(180%) brightness(105%)'
        }, // Instagram流行风格

        {
            id: 'juno', name: '朱诺', css:
                'contrast(110%) saturate(140%) sepia(20%) hue-rotate(-15deg)'
        }, // VSCO经典滤镜

        // 环境光效优化
        {
            id: 'sunset', name: '黄昏', css:
                'hue-rotate(-20deg) saturate(130%) contrast(115%) brightness(95%)'
        }, // 暖色调晚霞效果

        {
            id: 'moonlight', name: '月光', css:
                'brightness(85%) contrast(125%) hue-rotate(200deg) saturate(80%)'
        }, // 冷色月光效果

        // 特殊效果
        {
            id: 'soft-focus', name: '柔焦', css:
                'blur(1px) contrast(150%) brightness(105%)'
        }, // 人像柔肤效果

        {
            id: 'dramatic', name: '戏剧', css:
                'contrast(200%) brightness(80%) saturate(150%)'
        } // 高反差艺术效果
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

        // 添加视频元数据加载事件，用于调整视频显示比例
        video.addEventListener('loadedmetadata', () => {
            // 获取实际视频比例
            const actualRatio = video.videoWidth / video.videoHeight;
            // 移除固定宽高比，使用实际比例
            video.style.aspectRatio = `${actualRatio}`;
            // 确保视频内容完全填充显示区域
            video.style.objectFit = 'cover';
        });

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

        // 隐藏开始按钮和计时器选择
        captureButton.style.display = 'none';
        timerContainer.style.display = 'none';

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
        // 设置canvas大小与视频相同
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 在canvas上绘制当前视频帧（需要镜像处理）
        const context = canvas.getContext('2d');

        // 镜像处理：先翻转坐标系，再绘制，这样保存的照片也是镜像的
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // 恢复坐标系，以免影响后续绘制
        context.setTransform(1, 0, 0, 1, 0, 0);

        // 获取照片数据URL
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
        // 获取第一张照片的实际比例作为标准比例
        const firstPhotoImg = new Image();
        firstPhotoImg.onload = () => {
            const actualRatio = firstPhotoImg.width / firstPhotoImg.height;

            // 设置照片大小，基于实际比例
            const photoWidth = 600;
            const photoHeight = photoWidth / actualRatio;
            const padding = 20; // 照片之间和边缘的间距
            const cornerRadius = 20; // 圆角大小

            // 计算画布总尺寸
            const mergedWidth = photoWidth + (padding * 2); // 照片宽度加两侧间距
            const mergedHeight = (photoHeight * 4) + (padding * 5); // 4张照片高度加5个间距

            mergedCanvas.width = mergedWidth;
            mergedCanvas.height = mergedHeight;

            const mCtx = mergedCanvas.getContext('2d');

            // 填充白色背景
            mCtx.fillStyle = 'white';
            mCtx.fillRect(0, 0, mergedWidth, mergedHeight);

            // 绘制圆角矩形作为背景，使用用户选择的颜色
            mCtx.fillStyle = backgroundColor;
            roundRect(mCtx, 0, 0, mergedWidth, mergedHeight, cornerRadius, true, false);

            // 计算每个照片的位置 (竖向排列)
            const positions = [
                [padding, padding], // 第一张照片
                [padding, padding + photoHeight + padding], // 第二张照片
                [padding, padding + (photoHeight + padding) * 2], // 第三张照片
                [padding, padding + (photoHeight + padding) * 3]  // 第四张照片
            ];

            // 使用Promise.all确保所有照片都加载完成
            const imagePromises = photoDataArray.map((photoData, index) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const [x, y] = positions[index];

                        // 使用完整图片，不做任何裁剪
                        const drawWidth = photoWidth;
                        const drawHeight = photoHeight;

                        // 绘制背景和边框
                        mCtx.fillStyle = '#ffffff';
                        roundRect(mCtx, x, y, photoWidth, photoHeight, 12, true, false);

                        // 在圆角矩形内绘制照片 (使用裁剪区域确保照片在圆角内)
                        mCtx.save();
                        roundRect(mCtx, x, y, photoWidth, photoHeight, 12, false, true);
                        mCtx.clip();
                        mCtx.drawImage(img, x, y, drawWidth, drawHeight);
                        mCtx.restore();

                        resolve();
                    };
                    img.src = photoData;
                });
            });

            // 所有照片绘制完成后，更新显示
            Promise.all(imagePromises).then(() => {
                // 先显示基本合并图
                mergedPhoto.src = mergedCanvas.toDataURL('image/png');
                mergedPhoto.style.display = 'block';

                // 显示滤镜面板
                document.getElementById('filterPanel').style.display = 'block';

                // 应用当前选择的滤镜
                if (currentFilter !== 'normal') {
                    applyFilterToPreview();
                }
            });
        };
        firstPhotoImg.src = photoDataArray[0];
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

        // 创建一个新canvas用于预览
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = mergedCanvas.width;
        previewCanvas.height = mergedCanvas.height;
        const previewCtx = previewCanvas.getContext('2d');

        // 绘制背景
        previewCtx.fillStyle = 'white';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 绘制圆角矩形作为背景，使用选择的颜色
        previewCtx.fillStyle = backgroundColor;
        roundRect(previewCtx, 0, 0, previewCanvas.width, previewCanvas.height, 20, true, false);

        // 获取选中的滤镜
        const selectedFilter = filterOptions.find(f => f.id === currentFilter);

        if (selectedFilter) {
            console.log('应用滤镜:', selectedFilter.name, selectedFilter.css);
        }

        // 获取第一张照片的实际比例
        const photoWidth = 600;
        let photoHeight;

        // 使用Promise.all确保所有照片都加载并应用滤镜
        const photoPromises = photoDataArray.map((photoData, index) => {
            return new Promise((resolve) => {
                const photoImg = new Image();
                photoImg.onload = () => {
                    // 使用每张照片的实际比例
                    const actualRatio = photoImg.width / photoImg.height;
                    photoHeight = photoWidth / actualRatio;

                    const padding = 20;
                    const x = padding;
                    const y = padding + (photoHeight + padding) * index;

                    // 创建临时canvas应用滤镜
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = photoWidth;
                    tempCanvas.height = photoHeight;
                    const tempCtx = tempCanvas.getContext('2d');

                    // 应用滤镜效果
                    if (selectedFilter && currentFilter !== 'normal') {
                        tempCtx.filter = selectedFilter.css;
                    }

                    tempCtx.drawImage(photoImg, 0, 0, photoWidth, photoHeight);
                    tempCtx.filter = 'none';

                    // 在圆角矩形内绘制滤镜后的照片
                    previewCtx.save();
                    roundRect(previewCtx, x, y, photoWidth, photoHeight, 12, false, true);
                    previewCtx.clip();
                    previewCtx.drawImage(tempCanvas, x, y);
                    previewCtx.restore();

                    resolve();
                };
                photoImg.src = photoData;
            });
        });

        // 所有照片处理完成后更新预览
        Promise.all(photoPromises).then(() => {
            // 更新预览图
            mergedPhoto.src = previewCanvas.toDataURL('image/png');
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

        // 创建最终画布
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');

        // 使用Promise.all确保所有照片加载并正确测量
        const measurePromises = photoDataArray.map(photoData => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.src = photoData;
            });
        });

        Promise.all(measurePromises).then(dimensions => {
            const photoWidth = 600;
            const padding = 20;

            // 计算总高度，考虑到每张照片可能有不同的高度
            let totalHeight = padding;
            dimensions.forEach(dim => {
                const actualRatio = dim.width / dim.height;
                const photoHeight = photoWidth / actualRatio;
                totalHeight += photoHeight + padding;
            });

            // 设置画布尺寸
            finalCanvas.width = photoWidth + (padding * 2);
            finalCanvas.height = totalHeight;

            // 绘制背景
            finalCtx.fillStyle = 'white';
            finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // 绘制指定的背景颜色
            finalCtx.fillStyle = backgroundColor;
            roundRect(finalCtx, 0, 0, finalCanvas.width, finalCanvas.height, 20, true, false);

            // 获取选中的滤镜
            const selectedFilter = filterOptions.find(f => f.id === currentFilter);

            // 处理每张照片
            let currentY = padding;
            const photoPromises = photoDataArray.map((photoData, index) => {
                return new Promise(resolve => {
                    const photoImg = new Image();
                    photoImg.onload = () => {
                        const actualRatio = photoImg.width / photoImg.height;
                        const photoHeight = photoWidth / actualRatio;

                        // 创建临时canvas应用滤镜
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = photoWidth;
                        tempCanvas.height = photoHeight;
                        const tempCtx = tempCanvas.getContext('2d');

                        // 应用滤镜效果
                        if (selectedFilter && currentFilter !== 'normal') {
                            tempCtx.filter = selectedFilter.css;
                        }
                        tempCtx.drawImage(photoImg, 0, 0, photoWidth, photoHeight);
                        tempCtx.filter = 'none';

                        // 绘制照片
                        finalCtx.save();
                        roundRect(finalCtx, padding, currentY, photoWidth, photoHeight, 12, false, true);
                        finalCtx.clip();
                        finalCtx.drawImage(tempCanvas, padding, currentY);
                        finalCtx.restore();

                        // 更新Y位置
                        currentY += photoHeight + padding;

                        resolve();
                    };
                    photoImg.src = photoData;
                });
            });

            // 所有照片处理完成后创建下载链接
            Promise.all(photoPromises).then(() => {
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

        // 显示开始按钮和延时选择
        captureButton.style.display = 'block';
        timerContainer.style.display = 'flex';

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