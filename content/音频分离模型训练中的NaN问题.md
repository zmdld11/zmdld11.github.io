---
title: 音频分离模型训练中的NaN问题
comment: false
reward: false
date: 2026-03-23 18:40:51
tags: [技术,日志]
categories: 4ATS开发日志
---

# 修复日志报告：HT Demucs 模型混合精度训练 NaN 问题排查

**报告日期**：2026年3月23日
**项目模块**：音频分离模型训练 ([model.py](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html), [train.py](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html))
**问题现象**：在执行 [train.py](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 时，由于所有批次的损失函数全部计算为 `NaN`（Not a Number），导致连续 5 个 Epoch 训练被跳过并触发提前终止（Early Stopping）。

## 🔍 问题排查过程

1. **环境与重现测试**
   - 确认了 [torch.cuda.is_available()](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 正常运转。
   - 编写了单步前向传播验证脚本，传入形状为 `(2, 1, 44100)` 的高斯白噪声。
   - 发现在开启 [torch.amp.autocast('cuda')](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) (FP16 混合精度) 时，模型直接输出 `NaN`。而在移除混合精度后，输出特征的最大值达到了惊人的 `8.7622e+13`。
2. **内部张量震荡分析 (Forward Hooks)**
   - 通过对网络所有模块挂载 `register_forward_hook`，检查每一层输出的张量分布。
   - 监控发现在经过初始的 [Conv1d](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 和早期的 [DecoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 时，特征图的最大值按指数级暴增（依次达到数百、数千、数万），在第四/第五次卷积操作时由于数值突破了 FP16 的表达上限（~65504），引发了 `Inf / NaN` 异常（Overflow）。
3. **架构与代码审查**
   - **结构缺失**：审查 [model.py](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 中的 [EncoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 和 [DecoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html)，发现设计中仅包含纯线性计算（[Conv1d](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) -> `Residual` -> 输出），主干通道中既没有**特征归一化层**也缺少**非线性激活函数**。这导致网络处于纯线性叠加状态，使方差如滚雪球般累积放大。
   - **初始化缺陷**：类的结尾调用了一个名为 [rescale_module](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 的权重重置方法。该方法强制将所有卷积层权重的标准差（Standard Deviation）缩放为 `1.0`。在深度学习中，这严重违反了 He 初始化（Kaiming Init）或 Xavier 初始化的法则，导致随着通道数（fan_in）增加，卷积输出必然发生剧烈爆炸。

## 🛠️ 修复方案

针对查明的原因，对 [model.py](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 执行了以下两次核心修改：

### 1. 完善网络块的非线性和归一化 (Structural Fix)

对所有的编解码器基础块（[EncoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html), [DecoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html), [FreqEncoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html), [FreqDecoderLayer](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html)）引入了合理的归一化和激活：

- **添加归一化**：在卷积操作后插入了 [GroupNorm(1, out_channels)](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 以稳定前向特征的方差。
- **添加激活函数**：引入了 [GELU()](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 非线性激活以匹配 Demucs 及基于 Transformer 的现代网络架构要求。

### 2. 移除致命的权重强制缩放逻辑 (Initialization Fix)

定位到 [HTDemucs](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 初始化块最末尾的 [self.apply(lambda m: rescale_module(...))](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html)。

- **处理方式**：直接将其注释/移除，使模型回归 PyTorch 默认且安全的初始化范式（Kaiming Uniform）。

## ✅ 验证与结果

在应用上述双重修复后，重新运行了包含 [torch.amp.autocast('cuda')](vscode-file://vscode-app/c:/Users/ROG/AppData/Local/Programs/Microsoft VS Code/07ff9d6178/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 的前向传播验证脚本验证：

- **报错情况**：`NaN at ...` 的报错完全消失 (`Any NaN: tensor(False)` )。
- **数值表现**：相同高斯白噪声输入下，网络输出最大值从原来的 `8.76e+13` 收敛缩减至 `2.8100`。
- **结论**：混合精度（AMP）前向传播溢出问题得到彻底解决，可以继续使用原定基于 Transformer 构建的进阶级 `HT Demucs` 网络开启音频分离的主训练流程，无需降级回 Wave-U-Net 方案。
