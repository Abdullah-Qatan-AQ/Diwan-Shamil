from pathlib import Path
from PIL import Image

project_root = Path(__file__).resolve().parents[1]
source = Path('/home/ubuntu/icon-input/Screenshot_٢٠٢٦٠٩١٩_١٤٢٧١١_Chrome.jpg')
res = project_root / 'android' / 'app' / 'src' / 'main' / 'res'

# Crop the complete mark, including its subtle shadow, without stretching it.
image = Image.open(source).convert('RGB')
crop = image.crop((92, 34, 528, 460))
size = max(crop.size)
canvas = Image.new('RGB', (size, size), (250, 249, 245))
canvas.paste(crop, ((size - crop.width) // 2, (size - crop.height) // 2))

# Android launcher densities. Keep the original mark centered and unmodified in shape.
for folder, px in {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}.items():
    out = res / folder
    out.mkdir(parents=True, exist_ok=True)
    icon = canvas.resize((px, px), Image.Resampling.LANCZOS)
    for name in ('ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'):
        icon.save(out / name, format='PNG', optimize=True)

# Full-size foreground used by Android adaptive icons.
drawable = res / 'drawable-nodpi'
drawable.mkdir(parents=True, exist_ok=True)
canvas.resize((432, 432), Image.Resampling.LANCZOS).save(
    drawable / 'ic_launcher_foreground.png', format='PNG', optimize=True
)

print('Generated Android launcher icons from', source)
