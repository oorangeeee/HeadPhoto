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

    // 照片槽位
    const photoSlot1 = document.getElementById('photoSlot1');
    const photoSlot2 = document.getElementById('photoSlot2');
    const photoSlot3 = document.getElementById('photoSlot3');
    const photoSlot4 = document.getElementById('photoSlot4');
    const photoSlots = [photoSlot1, photoSlot2, photoSlot3, photoSlot4];

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

        // 在canvas上绘制当前视频帧
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 获取照片数据URL
        const photoData = canvas.toDataURL('image/png');
        photoDataArray.push(photoData);

        // 更新照片槽位显示
        updatePhotoSlot(photoCount, photoData);

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

    function updatePhotoSlot(index, photoData) {
        // 创建图片并添加到对应槽位
        const img = document.createElement('img');
        img.src = photoData;

        // 清除槽位内容并添加图片
        while (photoSlots[index].firstChild) {
            photoSlots[index].removeChild(photoSlots[index].firstChild);
        }

        photoSlots[index].appendChild(img);
    }

    function mergePhotos() {
        // 设置合并canvas的尺寸 - 改为竖排布局
        const photoWidth = 600;
        const photoHeight = photoWidth * 3 / 4; // 保持 3:4 比例
        const padding = 20; // 照片之间和边缘的间距
        const cornerRadius = 20; // 圆角大小

        // 计算画布总尺寸
        const mergedWidth = photoWidth + (padding * 2); // 照片宽度加两侧间距
        const mergedHeight = (photoHeight * 4) + (padding * 5); // 4张照片高度加5个间距(顶部、底部和照片之间)

        mergedCanvas.width = mergedWidth;
        mergedCanvas.height = mergedHeight;

        const mCtx = mergedCanvas.getContext('2d');

        // 填充白色背景
        mCtx.fillStyle = 'white';
        mCtx.fillRect(0, 0, mergedWidth, mergedHeight);

        // 绘制圆角矩形作为背景
        mCtx.fillStyle = '#f5f5f7';
        roundRect(mCtx, 0, 0, mergedWidth, mergedHeight, cornerRadius, true, false);

        // 计算每个照片的位置 (竖向排列)
        const positions = [
            [padding, padding], // 第一张照片
            [padding, padding + photoHeight + padding], // 第二张照片
            [padding, padding + (photoHeight + padding) * 2], // 第三张照片
            [padding, padding + (photoHeight + padding) * 3]  // 第四张照片
        ];

        // 绘制四张照片
        photoDataArray.forEach((photoData, index) => {
            const img = new Image();
            img.onload = () => {
                const [x, y] = positions[index];

                // 计算保持原始比例的尺寸
                const originalRatio = img.width / img.height;
                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

                if (originalRatio > (photoWidth / photoHeight)) {
                    // 图片较宽，以高度为基准
                    drawHeight = photoHeight;
                    drawWidth = drawHeight * originalRatio;
                    offsetX = (photoWidth - drawWidth) / 2;
                } else {
                    // 图片较高，以宽度为基准
                    drawWidth = photoWidth;
                    drawHeight = drawWidth / originalRatio;
                    offsetY = (photoHeight - drawHeight) / 2;
                }

                // 绘制背景和边框
                mCtx.fillStyle = '#ffffff';
                roundRect(mCtx, x, y, photoWidth, photoHeight, 12, true, false);

                // 在圆角矩形内绘制照片 (使用裁剪区域确保照片在圆角内)
                mCtx.save();
                roundRect(mCtx, x, y, photoWidth, photoHeight, 12, false, true);
                mCtx.clip();
                mCtx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
                mCtx.restore();

                // 如果是最后一张照片绘制完成，则更新合并后的图片
                if (index === 3) {
                    mergedPhoto.src = mergedCanvas.toDataURL('image/png');
                    mergedPhoto.style.display = 'block';
                }
            };
            img.src = photoData;
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

        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = mergedPhoto.src;
        downloadLink.download = `${fileName}.png`;

        // 触发下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        statusText.textContent = '大头贴已保存';
    }

    function resetPhotos() {
        // 重置照片计数和数据
        photoCount = 0;
        photoDataArray = [];

        // 重置照片槽位
        photoSlots.forEach(slot => {
            // 移除所有子元素
            while (slot.firstChild) {
                slot.removeChild(slot.firstChild);
            }

            // 添加数字标记
            const span = document.createElement('span');
            span.textContent = photoSlots.indexOf(slot) + 1;
            slot.appendChild(span);
        });

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
    }

    // 页面可见性处理
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    });
});