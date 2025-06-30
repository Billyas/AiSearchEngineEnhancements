// ==UserScript==
// @name        豆包自动发送助手,添加q=?查询参数
// @namespace   Violentmonkey Scripts
// @match       https://www.doubao.com/chat/*
// @grant       none
// @license MIT
// @version     1.10
// @author      Doubao Assistant
// @description 自动填充URL中的q参数到豆包聊天框并发送
// @downloadURL https://update.greasyfork.org/scripts/541111/%E8%B1%86%E5%8C%85%E8%87%AA%E5%8A%A8%E5%8F%91%E9%80%81%E5%8A%A9%E6%89%8B%2C%E6%B7%BB%E5%8A%A0q%3D%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0.user.js
// @updateURL https://update.greasyfork.org/scripts/541111/%E8%B1%86%E5%8C%85%E8%87%AA%E5%8A%A8%E5%8F%91%E9%80%81%E5%8A%A9%E6%89%8B%2C%E6%B7%BB%E5%8A%A0q%3D%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0.meta.js
// ==/UserScript==

/*
 * 功能说明：
 * 1. 自动提取URL中的q参数
 * 2. 智能填充到豆包聊天输入框
 * 3. 模拟真实用户输入行为
 * 4. 自动发送消息
 */

    async function addDoubaoQueryParam() {
        const query = new URLSearchParams(window.location.search).get('q');
        if (!query) {
            console.log('URL中未检测到q参数，脚本终止');
            return;
        }

        console.log(`检测到查询参数：${query}`);

        // 元素等待函数（优化版）
        const waitForElement = async (selectors, timeout = 10000) => {
            const selectorList = Array.isArray(selectors) ? selectors : [selectors];
            const startTime = Date.now();

            while (Date.now() - startTime < timeout) {
                for (const selector of selectorList) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`通过选择器 "${selector}" 定位到元素`);
                        return element;
                    }
                }
                await delay(300);
            }

            console.error(`元素定位超时：${selectorList.join(' / ')}`);
            throw new Error(`元素定位超时：${selectorList.join(' / ')}`);
        };

        // 延时函数
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // 注入式输入内容（保留核心逻辑）
        async function injectText(element, text) {
            console.log(`开始注入内容，长度：${text.length} 字符`);
            const chunks = splitTextIntoChunks(text);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                setNativeValue(element, chunk.content);
                triggerInputEvents(element);
                await delay(150 + Math.random() * 100);
            }

            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            console.log(`内容注入完成：${text}`);
        }

        // 简化的文本分块函数
        function splitTextIntoChunks(text) {
            const chunks = [];
            const maxChunkSize = 20;
            for (let i = 0; i < text.length; i += maxChunkSize) {
                chunks.push({ content: text.substring(i, i + maxChunkSize) });
            }
            return chunks;
        }

        // 设置原生值（保留必要逻辑）
        function setNativeValue(element, value) {
            const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

            if (valueSetter && valueSetter !== prototypeValueSetter) {
                prototypeValueSetter.call(element, value);
            } else {
                valueSetter.call(element, value);
            }
        }

        // 触发输入事件（简化版）
        function triggerInputEvents(element) {
            ['focus', 'input', 'change'].forEach(eventName => {
                const event = new Event(eventName, { bubbles: true, cancelable: true, composed: true });
                element.dispatchEvent(event);
            });
        }

        // 优化的点击函数
        async function realisticClick(element) {
            try {
                const rect = element.getBoundingClientRect();
                const clickX = rect.left + rect.width / 2;
                const clickY = rect.top + rect.height / 2;

                // 基础鼠标事件序列
                element.dispatchEvent(new MouseEvent('mouseenter', { clientX: clickX, clientY: clickY, bubbles: true }));
                await delay(100);

                element.dispatchEvent(new MouseEvent('mousedown', { clientX: clickX, clientY: clickY, bubbles: true, buttons: 1 }));
                await delay(50);

                element.dispatchEvent(new MouseEvent('mouseup', { clientX: clickX, clientY: clickY, bubbles: true, buttons: 0 }));
                element.dispatchEvent(new MouseEvent('click', { clientX: clickX, clientY: clickY, bubbles: true }));

                await delay(150);
            } catch (error) {
                console.log('鼠标模拟失败，尝试直接点击', error);
                element.click();
            }
        }

        try {
            // 定位输入框
            const textarea = await waitForElement([
                '[data-testid="chat_input_input"]',
                '.semi-input-textarea.semi-input-textarea-autosize'
            ]);

            textarea.focus();
            await delay(600);
            textarea.value = '';
            triggerInputEvents(textarea);
            await delay(200);

            // 注入内容
            await injectText(textarea, query);

            // 验证内容
            if (textarea.value.trim() !== query.trim()) {
                setNativeValue(textarea, query);
                triggerInputEvents(textarea);
                await delay(300);
            }

            console.log(`内容已成功设置：${query}`);
            await delay(500);

            // 定位发送按钮
            const sendButton = await waitForElement([
                '[data-testid="chat_input_send_button"]',
                '.semi-button-primary:not([disabled])'
            ]);

            console.log('准备发送消息...');
            textarea.focus();
            await delay(200);

            // 点击发送按钮（优化版）
            await realisticClick(sendButton);

            // 等待发送结果
            await delay(1000);

            if (textarea.value.trim() !== '') {
                console.warn('警告：尝试使用Enter键发送');
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
                textarea.dispatchEvent(enterEvent);
                await delay(150);
                textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
                await delay(1000);
            }

            console.log('消息已成功发送！');

        } catch (error) {
            console.error('脚本执行失败:', error.message);
        }
    }

    if (window.location.host === 'www.doubao.com' && window.location.pathname.startsWith('/chat')) {
        addDoubaoQueryParam();
    }
