// ==UserScript==
// @name         ACE CP v9.2
// @namespace    http://tampermonkey.net/
// @version      9.2
// @description  ACE专用
// @author       ANWY
// @match        https://awards.komchadluek.net/KA8
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        targetCandidate: 'ฟรีน-เบ็คกี้',
        phoneNumber: '0944256703',
        waitTimeout: 5 * 60 * 1000,
        theme: {
            primary: '#FF5C7F',
            secondary: '#FF8FA3',
            accent: '#FF2D5A',
            text: '#FFFFFF',
            background: 'rgba(255, 230, 235, 0.95)',
            success: '#A8E6CF',
            info: '#A2D2FF',
            warning: '#FFD3B6',
            error: '#FF5252',
            disabled: 'rgba(200, 200, 200, 0.5)'
        },
        animation: {
            duration: '0.3s',
            timing: 'cubic-bezier(0.25, 0.8, 0.25, 1)'
        },
        logo: 'https://i.postimg.cc/9QMVn0WG/p.png',
        languages: {
            zh: {
                title: 'ACE TEAM CN 投票助手',
                reset: '重置计数器',
                statusReady: '准备就绪',
                statusReset: '计数器已重置',
                statusSelecting: '正在选择投票选项...',
                statusSelected: '已选择: ',
                statusFilling: '已填写电话号码',
                statusAgreement: '已勾选同意条款',
                statusSubmitting: '正在提交投票...',
                statusSuccess: '投票成功! (总计: ',
                statusNotFound: '未找到投票选项',
                statusCoolDown: '冷却中，清除Cookies...',
                statusClearing: '正在清除Cookies...',
                statusCleared: 'Cookies已清除，即将刷新...',
                statusStarted: 'ACE 投票助手已启动',
                statusWaiting: '等待确认中... (剩余时间: ',
                statusTimeout: '等待超时，正在清除Cookies...',
                language: '切换语言',
                clearCookies: '清除Cookies',
                disabledOption: '已禁用非目标选项'
            },
            en: {
                title: 'ACE TEAM CN Voting Helper',
                reset: 'Reset Counter',
                statusReady: 'Ready',
                statusReset: 'Counter reset',
                statusSelecting: 'Selecting vote option...',
                statusSelected: 'Selected: ',
                statusFilling: 'Phone number filled',
                statusAgreement: 'Agreement checked',
                statusSubmitting: 'Submitting vote...',
                statusSuccess: 'Vote successful! (Total: ',
                statusNotFound: 'Vote option not found',
                statusCoolDown: 'Cool down, deleting cookies...',
                statusClearing: 'Clearing cookies...',
                statusCleared: 'Cookies cleared, refreshing...',
                statusStarted: 'ACE Voting Helper started',
                statusWaiting: 'Waiting for confirmation... (time left: ',
                statusTimeout: 'Timeout reached, clearing cookies...',
                language: 'Change Language',
                clearCookies: 'Clear Cookies',
                disabledOption: 'Disabled non-target options'
            },
            th: {
                title: 'เครื่องมือช่วยโหวต ACE TEAM CN',
                reset: 'รีเซ็ตตัวนับ',
                statusReady: 'พร้อมใช้งาน',
                statusReset: 'รีเซ็ตตัวนับแล้ว',
                statusSelecting: 'กำลังเลือกตัวเลือก...',
                statusSelected: 'เลือกแล้ว: ',
                statusFilling: 'กรอกหมายเลขโทรศัพท์แล้ว',
                statusAgreement: 'ยอมรับเงื่อนไขแล้ว',
                statusSubmitting: 'กำลังส่งการโหวต...',
                statusSuccess: 'โหวตสำเร็จ! (รวม: ',
                statusNotFound: 'ไม่พบตัวเลือกการโหวต',
                statusCoolDown: 'กำลังรอเวลา ลบคุกกี้...',
                statusClearing: 'กำลังลบคุกกี้...',
                statusCleared: 'ลบคุกกี้แล้ว กำลังรีเฟรช...',
                statusStarted: 'เครื่องมือช่วยโหวต ACE เริ่มทำงานแล้ว',
                statusWaiting: 'กำลังรอการยืนยัน... (เวลาที่เหลือ: ',
                statusTimeout: 'เกินเวลาที่กำหนด, กำลังลบคุกกี้...',
                language: 'เปลี่ยนภาษา',
                clearCookies: 'ลบคุกกี้',
                disabledOption: 'ปิดการใช้งานตัวเลือกอื่น'
            }
        }
    };

    let voteCount = localStorage.getItem('voteCount') ? parseInt(localStorage.getItem('voteCount')) : 0;
    let hasDeletedCookie = false;
    let hasVoted = false;
    let currentLanguage = localStorage.getItem('aceLanguage') || 'zh';
    let waitTimer = null;
    let countdownInterval = null;
    let timeLeft = CONFIG.waitTimeout / 1000;

    const style = document.createElement('style');
    style.textContent = `
        .ace-container {
            font-family: 'Poppins', 'Noto Sans Thai', 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            transition: all ${CONFIG.animation.duration} ${CONFIG.animation.timing};
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
        }

        .ace-counter-box {
            position: fixed;
            top: 25px;
            right: 25px;
            z-index: 9999;
            padding: 18px 24px;
            background: linear-gradient(135deg, ${CONFIG.theme.primary}, ${CONFIG.theme.secondary});
            color: ${CONFIG.theme.text};
            border-radius: 16px;
            font-size: 15px;
            font-weight: 600;
            min-width: 220px;
        }

        .ace-counter-box:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(255, 92, 127, 0.35);
        }

        .ace-counter-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .ace-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(90deg, #FFFFFF, #F3F3F3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
        }

        .ace-logo {
            width: 24px;
            height: 24px;
            margin-right: 10px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .ace-counter-value {
            font-size: 24px;
            font-weight: 800;
            color: ${CONFIG.theme.text};
            margin-left: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .ace-button {
            margin-top: 12px;
            padding: 10px 18px;
            background: rgba(255, 255, 255, 0.2);
            color: ${CONFIG.theme.text};
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
        }

        .ace-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        .ace-button:active {
            transform: translateY(0);
        }

        .ace-delete-button {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 9999;
            padding: 16px 32px;
            background: linear-gradient(45deg, ${CONFIG.theme.error}, #FF3D3D);
            color: ${CONFIG.theme.text};
            border: none;
            border-radius: 16px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 6px 20px rgba(255, 82, 82, 0.45);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
        }

        .ace-delete-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(255, 82, 82, 0.65);
        }

        .ace-delete-button:active {
            transform: translateY(0);
        }

        .ace-icon {
            margin-right: 10px;
            font-size: 18px;
        }

        .ace-progress {
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            margin-top: 12px;
            overflow: hidden;
        }

        .ace-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, ${CONFIG.theme.success}, ${CONFIG.theme.info});
            width: ${Math.min(voteCount % 100, 100)}%;
            transition: width 0.5s ease;
        }

        .ace-status {
            font-size: 12px;
            margin-top: 8px;
            opacity: 0.8;
            text-align: right;
        }

        .ace-language-selector {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
        }

        .ace-language-btn {
            flex: 1;
            padding: 8px;
            margin: 0 2px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 6px;
            color: ${CONFIG.theme.text};
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .ace-language-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .ace-language-btn.active {
            background: rgba(255, 255, 255, 0.4);
            font-weight: bold;
        }

        .card-vote.ace-disabled {
            opacity: 0.5;
            pointer-events: none;
            position: relative;
        }

        .card-vote.ace-disabled::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${CONFIG.theme.disabled};
            z-index: 1;
            border-radius: 8px;
        }
    `;
    document.head.appendChild(style);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    function getTranslation(key) {
        return CONFIG.languages[currentLanguage][key] || key;
    }

    function updateUI() {
        const title = document.querySelector('.ace-title');
        const resetButton = document.querySelector('#resetCounter span:last-child');
        const deleteButton = document.querySelector('.ace-delete-button span:last-child');
        const statusElement = document.getElementById('aceStatus');

        if (title) title.innerHTML = `<img src="${CONFIG.logo}" class="ace-logo" alt="ACE Logo">${getTranslation('title')}`;
        if (resetButton) resetButton.textContent = getTranslation('reset');
        if (deleteButton) deleteButton.textContent = getTranslation('clearCookies');
        if (statusElement) statusElement.textContent = getTranslation('statusReady');

        const languageButtons = document.querySelectorAll('.ace-language-btn');
        languageButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.lang === currentLanguage);
        });
    }

    function createCounterBox() {
        const counterBox = document.createElement('div');
        counterBox.className = 'ace-container ace-counter-box';
        counterBox.innerHTML = `
            <div class="ace-counter-header">
                <h3 class="ace-title">
                    <img src="${CONFIG.logo}" class="ace-logo" alt="ACE Logo">
                    ${getTranslation('title')}
                </h3>
                <span id="voteCounter" class="ace-counter-value">${voteCount}</span>
            </div>
            <div class="ace-progress">
                <div class="ace-progress-bar"></div>
            </div>
            <div class="ace-status" id="aceStatus">${getTranslation('statusReady')}</div>
            <button id="resetCounter" class="ace-button">
                <span class="ace-icon">🔄</span>
                <span>${getTranslation('reset')}</span>
            </button>
            <div class="ace-language-selector">
                <button class="ace-language-btn ${currentLanguage === 'zh' ? 'active' : ''}" data-lang="zh">中文</button>
                <button class="ace-language-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">EN</button>
                <button class="ace-language-btn ${currentLanguage === 'th' ? 'active' : ''}" data-lang="th">ไทย</button>
            </div>
        `;

        const resetButton = counterBox.querySelector('#resetCounter');
        resetButton.addEventListener('click', () => {
            voteCount = 0;
            localStorage.setItem('voteCount', voteCount);
            updateCounter();
            updateStatus(getTranslation('statusReset'), CONFIG.theme.info);
        });

        const languageButtons = counterBox.querySelectorAll('.ace-language-btn');
        languageButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentLanguage = button.dataset.lang;
                localStorage.setItem('aceLanguage', currentLanguage);
                updateUI();
                updateStatus(getTranslation('statusReady'), CONFIG.theme.info);
            });
        });

        document.body.appendChild(counterBox);
    }

    function createDeleteCookieButton() {
        const deleteCookieButton = document.createElement('button');
        deleteCookieButton.className = 'ace-container ace-delete-button';
        deleteCookieButton.innerHTML = `
            <span class="ace-icon">🧹</span>
            <span>${getTranslation('clearCookies')}</span>
        `;
        deleteCookieButton.addEventListener('click', () => {
            clearTimeout(waitTimer);
            clearInterval(countdownInterval);
            updateStatus(getTranslation('statusClearing'), CONFIG.theme.warning);
            delCookie();
            setTimeout(() => {
                updateStatus(getTranslation('statusCleared'), CONFIG.theme.success);
                setTimeout(() => {
                    window.location.reload(true);
                }, 1000);
            }, 500);
        });

        document.body.appendChild(deleteCookieButton);
    }

    function updateCounter() {
        const counter = document.getElementById('voteCounter');
        if (counter) {
            counter.textContent = voteCount;
            const progressBar = document.querySelector('.ace-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.min(voteCount % 100, 100)}%`;
            }
        }
    }

    function updateStatus(message, color = CONFIG.theme.text) {
        const statusElement = document.getElementById('aceStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = color;
        }
    }

    function delCookie() {
        if (hasDeletedCookie) return;
        hasDeletedCookie = true;

        document.cookie.split(';').forEach((c) => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
        });

        console.log('Cookies cleared');
    }

    function disableNonTargetOptions() {
        const allCards = document.querySelectorAll('.card-vote');
        let foundTarget = false;

        allCards.forEach(card => {
            const nameElement = card.querySelector('.ant-card-body span');
            if (nameElement && nameElement.textContent.trim() === CONFIG.targetCandidate) {
                foundTarget = true;
                card.classList.remove('ace-disabled');
            } else {
                card.classList.add('ace-disabled');
            }
        });

        if (foundTarget) {
            updateStatus(getTranslation('disabledOption'), CONFIG.theme.info);
        }
        return foundTarget;
    }

    function selectVoteCard() {
        const targetCards = document.querySelectorAll('.card-vote:not(.ace-disabled) .ant-card-body span');

        for (let element of targetCards) {
            if (element.textContent.trim() === CONFIG.targetCandidate) {
                element.closest('.ant-card').click();
                updateStatus(getTranslation('statusSelected') + CONFIG.targetCandidate, CONFIG.theme.success);
                console.log('Selected vote target:', CONFIG.targetCandidate);
                return true;
            }
        }

        updateStatus(getTranslation('statusNotFound'), CONFIG.theme.error);
        console.log('Vote option not found');
        return false;
    }

    function fillInput() {
        const phoneInput = document.querySelector('#form_voter_voter_phone');
        if (phoneInput) {
            phoneInput.value = CONFIG.phoneNumber;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            updateStatus(getTranslation('statusFilling'), CONFIG.theme.success);
        }
    }

    function checkAgreement() {
        const checkbox = document.querySelector('#form_agreement');
        if (checkbox && !checkbox.checked) {
            checkbox.click();
            updateStatus(getTranslation('statusAgreement'), CONFIG.theme.success);
        }
    }

    function clickVoteButton() {
        if (hasVoted) return;
        hasVoted = true;

        const submitButton = document.querySelector('#btn button');
        if (submitButton) {
            setTimeout(() => {
                submitButton.click();
                updateStatus(getTranslation('statusSubmitting'), CONFIG.theme.info);
                console.log('Clicked vote button');

                startWaitTimer();
            }, 1000);
        }
    }

    function startWaitTimer() {
        timeLeft = CONFIG.waitTimeout / 1000;

        updateStatus(getTranslation('statusWaiting') + formatTime(timeLeft) + ')', CONFIG.theme.info);

        countdownInterval = setInterval(() => {
            timeLeft--;
            updateStatus(getTranslation('statusWaiting') + formatTime(timeLeft) + ')', CONFIG.theme.info);

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                handleTimeout();
            }
        }, 1000);

        waitTimer = setTimeout(() => {
            clearInterval(countdownInterval);
            handleTimeout();
        }, CONFIG.waitTimeout);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function handleTimeout() {
        updateStatus(getTranslation('statusTimeout'), CONFIG.theme.error);
        console.log('Timeout reached, clearing cookies');

        const deleteButton = document.querySelector('.ace-delete-button');
        if (deleteButton) {
            deleteButton.click();
        } else {
            updateStatus(getTranslation('statusClearing'), CONFIG.theme.warning);
            delCookie();
            setTimeout(() => {
                updateStatus(getTranslation('statusCleared'), CONFIG.theme.success);
                setTimeout(() => {
                    window.location.reload(true);
                }, 1000);
            }, 500);
        }
    }

    function clickOKButton() {
        const okButtons = document.querySelectorAll('button');
        okButtons.forEach(button => {
            if (button.innerText.includes('OK') && !button.hasAttribute('data-vote-counted')) {
                console.log('Found OK button, clicking...');
                button.setAttribute('data-vote-counted', 'true');
                button.click();

                clearTimeout(waitTimer);
                clearInterval(countdownInterval);

                voteCount++;
                localStorage.setItem('voteCount', voteCount);
                updateCounter();
                updateStatus(getTranslation('statusSuccess') + `${voteCount})`, CONFIG.theme.success);
                console.log('Vote successful, current vote count:', voteCount);

                setTimeout(() => {
                    hasVoted = false;
                }, 1000);
            }
        });
    }

    const observer = new MutationObserver(() => {
        if (hasVoted) return;

        const phoneInput = document.querySelector('#form_voter_voter_phone');
        const checkbox = document.querySelector('#form_agreement');
        const targetCards = document.querySelectorAll('.card-vote .ant-card-body span');

        if (phoneInput && checkbox && targetCards.length > 0) {
            if (disableNonTargetOptions()) {
                updateStatus(getTranslation('statusSelecting'), CONFIG.theme.info);
                if (selectVoteCard()) {
                    fillInput();
                    checkAgreement();
                    clickVoteButton();
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const popupObserver = new MutationObserver(() => {
        clickOKButton();
    });

    popupObserver.observe(document.body, { childList: true, subtree: true });

    window.onload = function() {
        const bodyText = document.body.innerText;
        const checkText = 'สามารถโหวตได้ใหม่ในอีก';

        if (bodyText.includes(checkText)) {
            updateStatus(getTranslation('statusCoolDown'), CONFIG.theme.warning);
            console.log('Cool down detected, deleting cookies and refreshing page');
            delCookie();
            setTimeout(() => {
                window.location.reload(true);
            }, 2000);
        }
    };

    createCounterBox();
    createDeleteCookieButton();
    updateStatus(getTranslation('statusStarted'), CONFIG.theme.info);
})();
