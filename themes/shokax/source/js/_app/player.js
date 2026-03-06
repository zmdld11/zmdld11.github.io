"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAudioPlayer = void 0;
var globalVars_1 = require("./globals/globalVars");
require("nyx-player/style");
// 音频淡入淡出工具函数（支持取消）
var fadeAudio = function (audio, targetVolume, duration) {
    if (duration === void 0) { duration = 500; }
    var timer = null;
    var cancelled = false;
    var promise = new Promise(function (resolve) {
        var startVolume = audio.volume;
        var volumeDiff = targetVolume - startVolume;
        var steps = 20;
        var stepDuration = duration / steps;
        var currentStep = 0;
        timer = setInterval(function () {
            if (cancelled) {
                clearInterval(timer);
                resolve();
                return;
            }
            currentStep++;
            audio.volume = startVolume + volumeDiff * (currentStep / steps);
            if (currentStep >= steps) {
                clearInterval(timer);
                audio.volume = targetVolume;
                resolve();
            }
        }, stepDuration);
    });
    var cancel = function () {
        cancelled = true;
        if (timer)
            clearInterval(timer);
    };
    return { promise: promise, cancel: cancel };
};
var initAudioPlayer = function () {
    return __awaiter(this, void 0, void 0, function () {
        var urls, initPlayer, checkAudio;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    urls = globalVars_1.CONFIG.audio.map(function (item) { return ({
                        name: item.title,
                        url: item.list[0],
                    }); });
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('nyx-player'); })];
                case 1:
                    initPlayer = (_a.sent()).initPlayer;
                    initPlayer('#player', '#showBtn', urls, '#playBtn', 'html[data-theme="dark"]', 'shokax');
                    checkAudio = setInterval(function () {
                        var audioEl = document.querySelector('#MusicPlayerRoot audio');
                        if (audioEl) {
                            clearInterval(checkAudio);
                            enhanceAudioWithFade(audioEl);
                        }
                    }, 100);
                    return [2 /*return*/];
            }
        });
    });
};
exports.initAudioPlayer = initAudioPlayer;
function enhanceAudioWithFade(audioEl) {
    var _this = this;
    var originalPause = audioEl.pause.bind(audioEl);
    var currentFade = null;
    var targetVolume = audioEl.volume; // 用户设定的目标音量
    var isFading = false; // 是否正在淡入淡出
    var cancelCurrentFade = function () {
        if (currentFade) {
            currentFade.cancel();
            currentFade = null;
        }
        isFading = false;
    };
    // 监听音量变化，更新目标音量（仅在非淡入淡出且非暂停时）
    audioEl.addEventListener('volumechange', function () {
        if (!isFading && !audioEl.paused) {
            targetVolume = audioEl.volume;
        }
    });
    // 监听 play 事件（捕获阶段），开始淡入
    audioEl.addEventListener('play', function () {
        // 取消任何正在进行的淡入淡出
        cancelCurrentFade();
        // 如果当前音量已经是目标音量，无需淡入（例如从暂停恢复且音量没变）
        if (audioEl.volume === targetVolume) {
            return;
        }
        isFading = true;
        // 强制从 0 开始淡入，确保平滑
        audioEl.volume = 0;
        // 使用微任务或 setTimeout 确保音量设置生效，并避免与浏览器内部冲突
        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var fade;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isFading)
                            return [2 /*return*/]; // 可能被取消
                        fade = fadeAudio(audioEl, targetVolume, 300);
                        currentFade = fade;
                        return [4 /*yield*/, fade.promise];
                    case 1:
                        _a.sent();
                        if (isFading) {
                            isFading = false;
                            currentFade = null;
                        }
                        return [2 /*return*/];
                }
            });
        }); }, 0);
    }, { capture: true } // 捕获阶段优先执行
    );
    // 重写 pause 方法，先淡出再暂停
    audioEl.pause = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fade;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // 如果已经暂停，忽略
                        if (audioEl.paused)
                            return [2 /*return*/];
                        cancelCurrentFade();
                        isFading = true;
                        fade = fadeAudio(audioEl, 0, 300);
                        currentFade = fade;
                        return [4 /*yield*/, fade.promise
                            // 确保淡出完成后真正暂停
                        ];
                    case 1:
                        _a.sent();
                        // 确保淡出完成后真正暂停
                        if (isFading) {
                            originalPause.call(audioEl);
                            isFading = false;
                            currentFade = null;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
}
