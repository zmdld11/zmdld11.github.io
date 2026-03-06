"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_URL = exports.LOCAL_HASH = exports.oWinWidth = exports.oWinHeight = exports.headerHight = exports.headerHightInner = exports.siteNavHeight = exports.siteSearch = exports.showContents = exports.goToComment = exports.backToTop = exports.toolBtn = exports.siteBrand = exports.sideBar = exports.quickBtn = exports.menuToggle = exports.siteHeader = exports.siteNav = exports.loadCat = exports.Container = exports.HTML = exports.BODY = exports.titleTime = exports.originTitle = exports.diffY = exports.scrollAction = exports.statics = exports.CONFIG = void 0;
exports.setSiteNavHeight = setSiteNavHeight;
exports.setHeaderHightInner = setHeaderHightInner;
exports.setHeaderHight = setHeaderHight;
exports.setOWinHeight = setOWinHeight;
exports.setOWinWidth = setOWinWidth;
exports.setDiffY = setDiffY;
exports.setTitleTime = setTitleTime;
exports.setLocalHash = setLocalHash;
exports.setLocalUrl = setLocalUrl;
exports.setOriginTitle = setOriginTitle;
exports.setBackToTop = setBackToTop;
exports.setGoToComment = setGoToComment;
exports.setShowContents = setShowContents;
exports.setToolBtn = setToolBtn;
exports.setSiteSearch = setSiteSearch;
exports.CONFIG = shokax_CONFIG;
exports.statics = exports.CONFIG.statics.indexOf('//') > 0 ? exports.CONFIG.statics : exports.CONFIG.root;
exports.scrollAction = { x: 0, y: 0 };
exports.diffY = 0;
exports.BODY = document.getElementsByTagName('body')[0];
exports.HTML = document.documentElement;
exports.Container = document.getElementById('container');
exports.loadCat = document.getElementById('loading');
exports.siteNav = document.getElementById('nav');
exports.siteHeader = document.getElementById('header');
exports.menuToggle = exports.siteNav.querySelector('.toggle');
exports.quickBtn = document.getElementById('quick');
exports.sideBar = document.getElementById('sidebar');
exports.siteBrand = document.getElementById('brand');
exports.toolBtn = document.getElementById('tool');
exports.siteSearch = document.getElementById('search');
exports.oWinHeight = window.innerHeight;
exports.oWinWidth = window.innerWidth;
exports.LOCAL_HASH = 0;
exports.LOCAL_URL = window.location.href;
function setSiteNavHeight(value) {
    exports.siteNavHeight = value;
}
function setHeaderHightInner(value) {
    exports.headerHightInner = value;
}
function setHeaderHight(value) {
    exports.headerHight = value;
}
function setOWinHeight(value) {
    exports.oWinHeight = value;
}
function setOWinWidth(value) {
    exports.oWinWidth = value;
}
function setDiffY(value) {
    exports.diffY = value;
}
function setTitleTime(value) {
    exports.titleTime = value;
}
function setLocalHash(value) {
    exports.LOCAL_HASH = value;
}
function setLocalUrl(value) {
    exports.LOCAL_URL = value;
}
function setOriginTitle(value) {
    exports.originTitle = value;
}
function setBackToTop(value) {
    exports.backToTop = value;
}
function setGoToComment(value) {
    exports.goToComment = value;
}
function setShowContents(value) {
    exports.showContents = value;
}
function setToolBtn(value) {
    exports.toolBtn = value;
}
function setSiteSearch(value) {
    exports.siteSearch = value;
}
