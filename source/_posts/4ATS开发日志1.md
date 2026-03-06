---
title: 4ATS开发日志1
comment: false
reward: false
date: 2026-03-06 20:26:35
tags: [技术,日志]
categories: 4ATS开发日志
---

### 工作日志（2026-03-06）

#### 主要目标

将分离模型训练搬上AutoDL。

#### 工作内容

1. **修复音频加载问题**
   - 原代码使用 `torchaudio.load` 依赖 FFmpeg，但环境中缺少相关库，导致 `libtorchcodec` 加载失败。
   - 改用 `soundfile` 库直接读取音频文件，修改 `src/sep/dataset.py`，替换音频加载方式，并添加路径转换逻辑，将 Windows 格式路径映射为 Linux 真实路径（`/root/autodl-tmp/4ATS/data/extract`）。
2. **解决模型前向传播中的维度错误**
   - **LayerScale 层**：修复了 `gamma` 张量与输入 `x` 形状不匹配的问题，通过 `view` 扩展维度实现正确广播。
   - **FreqPositionalEmbedding 层**：调整了维度置换逻辑，使频率位置嵌入能正确加到频域特征图上。
   - **扩散模块（DiffusionModule）**：修正了 `forward_train` 中噪声系数的维度，确保与特征张量对齐。
   - **解码器跳跃连接**：在 `DecoderLayer` 和 `FreqDecoderLayer` 中添加时间/频率维度的裁剪，避免拼接时长度不一致。
   - **ISTFT 输出**：对频域分支输出的频谱进行插值，确保频率维度符合 `n_fft/2+1` 要求，并手动裁剪/填充时域分支输出，使两者长度一致。
3. **处理训练过程中的 NaN 问题**
   - 训练初期出现 `loss=nan` 和 `val_sdr=nan`，怀疑是梯度爆炸或数值不稳定。
   - 修改 `train.py`：
     - 将损失函数从 `L1Loss` 改为 `SmoothL1Loss`，增强鲁棒性。
     - 添加梯度裁剪（`clip_grad_norm_`）。
     - 在训练循环中检查 loss、输出和参数是否为 NaN，跳过异常 batch。
     - 引入连续 NaN epoch 检测，超过阈值则提前终止。
     - 对输入音频进行标准化（均值 0，标准差 1），避免极值。
     - 将学习率从 `3e-4` 调低至 `1e-4`。
4. **添加训练日志记录功能**
   - 在 `train.py` 中创建日志文件 `sep_model/logs/log_时间戳.txt`，记录每个 epoch 的配置信息、训练损失、扩散损失、验证 SDR、模型保存情况以及 NaN 统计。
   - 日志文件便于后期分析训练趋势和问题排查。
5. **学习如何解读训练指标**
   - 用户询问日志中的参数含义，解释了 Train Loss（训练损失，越小越好）、Diff Loss（扩散损失，反映特征建模质量）、Val SDR（分离质量核心指标，越高越好）的变化趋势。
   - 当前训练 8 个 epoch 后，Train Loss 从 0.1105 降至 0.0119，Diff Loss 从 1.041 降至 0.707，Val SDR 从 -28.29 dB 提升至 -18.52 dB，模型正在有效学习，但仍有 NaN batch 出现。

#### 下一步计划

- 继续监控训练，若 NaN 频率过高则进一步调整超参数（如降低扩散损失权重、减小学习率）。
- 待分离模型训练稳定后，再集成到 `test_guitar_timeline.py` 进行实际测试（该脚本目前暂未使用）。

#### 遇到的问题及解决

- **FFmpeg 依赖** → 切换为 soundfile。
- **Windows/Linux 路径不兼容** → 添加路径转换函数。
- **模型维度错误** → 逐个模块调试并修正。
- **训练 NaN** → 增强数值稳定性措施，跳过异常 batch。
- **日志需求** → 添加文件日志记录。
