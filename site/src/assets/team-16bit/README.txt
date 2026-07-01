# 16-bit SNES team sprites (the shipped set). Slugs + art spec: docs/design/team-hero-sprites-16bit.md
# <slug>.png       = x4 (256px) shipped asset, served as-is with image-rendering: pixelated
# <slug>@2x.png    = x8 (512px) retina, wired via srcset
# _src/<slug>.png  = 64px master (source of truth); glob is single-level so _src is skipped
# Composite code-reviewer is a wide 5:2 strip (640x256). Until a sprite lands, TeamGrid renders a placeholder.
