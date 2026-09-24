// 全站共享的音频播放器：单例 audio，歌单来自常动层 playlist.json（构建期内联，无运行时请求）
// UI（首页卡片 / 悬浮迷你条）通过 window "blogplayer" 事件同步状态
import playlist from "../content/settings/playlist.json";

let audio = null;
let index = 0;
let playing = false;

function state() {
  return {
    playing,
    index,
    track: playlist[index],
    currentTime: audio?.currentTime ?? 0,
    duration: audio?.duration ?? 0,
    total: playlist.length,
  };
}

function emit() {
  window.dispatchEvent(new CustomEvent("blogplayer", { detail: state() }));
}

function ensure() {
  if (audio) return audio;
  audio = new Audio();
  audio.src = playlist[index].url;
  audio.addEventListener("ended", () => next());
  audio.addEventListener("timeupdate", emit);
  audio.addEventListener("loadedmetadata", emit);
  audio.addEventListener("play", () => {
    playing = true;
    emit();
  });
  audio.addEventListener("pause", () => {
    playing = false;
    emit();
  });
  return audio;
}

function load(i, autoplay) {
  index = (i + playlist.length) % playlist.length;
  if (audio) audio.src = playlist[index].url;
  if (autoplay) play();
  else emit();
}

function play() {
  ensure().play().catch(() => {});
}
function pause() {
  audio?.pause();
}
function toggle() {
  playing ? pause() : play();
}
function next() {
  load(index + 1, playing);
}
function prev() {
  load(index - 1, playing);
}
function seek(ratio) {
  if (audio?.duration) audio.currentTime = ratio * audio.duration;
}

export const BlogPlayer = { state, toggle, play, pause, next, prev, seek };
