// 全站共享的音频播放器：单例 audio，歌单来自常动层配置（构建期内联，无运行时 API 请求）
// source = "netease"：构建期 scripts/fetch-netease.mjs 同步公开歌单，播放走网易云官方外链
//   outer/url（VIP/灰色歌不可播，error 时自动跳下一首）；未同步到数据则回退 playlist.json
// UI（首页卡片 / 悬浮迷你条）通过 window "blogplayer" 事件同步状态
import localPlaylist from "../content/settings/playlist.json";
import musicCfg from "../content/settings/music.json";
import netease from "../data/netease.json";

const useNetease =
  musicCfg.source === "netease" && !!netease.playlistId && netease.tracks.length > 0;
const playlist = useNetease
  ? netease.tracks.map((t) => ({
      title: t.title,
      artist: t.artist,
      url: `https://music.163.com/song/media/outer/url?id=${t.id}.mp3`,
      netease: true,
    }))
  : localPlaylist;

let audio = null;
let index = 0;
let playing = false;
let errStreak = 0;

function state() {
  return {
    playing,
    index,
    track: playlist[index],
    currentTime: audio?.currentTime ?? 0,
    duration: audio?.duration ?? 0,
    total: playlist.length,
    source: useNetease ? "netease" : "local",
  };
}

function emit() {
  window.dispatchEvent(new CustomEvent("blogplayer", { detail: state() }));
}

function ensure() {
  if (audio) return audio;
  audio = new Audio();
  audio.referrerPolicy = "no-referrer";
  audio.src = playlist[index].url;
  audio.addEventListener("ended", () => next());
  audio.addEventListener("timeupdate", emit);
  audio.addEventListener("loadedmetadata", () => {
    errStreak = 0;
    emit();
  });
  audio.addEventListener("play", () => {
    playing = true;
    emit();
  });
  audio.addEventListener("pause", () => {
    playing = false;
    emit();
  });
  audio.addEventListener("error", () => {
    // 网易云外链对 VIP/灰色歌曲返回提示音或失败：跳过并继续；整单不可播时停下
    if (!playlist[index]?.netease || !audio) return;
    if (++errStreak >= playlist.length) {
      playing = false;
      emit();
      return;
    }
    next();
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
