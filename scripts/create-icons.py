from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root = Path(__file__).resolve().parent.parent
out = root / 'public' / 'icons'
out.mkdir(parents=True, exist_ok=True)
font_path = Path('C:/Windows/Fonts/YuGothB.ttc')
if not font_path.exists(): font_path = Path('C:/Windows/Fonts/msgothic.ttc')
base = Image.new('RGB', (512, 512), '#12372a')
draw = ImageDraw.Draw(base)
draw.rounded_rectangle((80,80,432,432),radius=65,fill='#eee4ce')
font=ImageFont.truetype(str(font_path),245)
draw.text((256,250),'日',font=font,anchor='mm',fill='#12372a')
for size in (192,512): base.resize((size,size),Image.Resampling.LANCZOS).save(out / f'icon-{size}.png')
base.save(root / 'desktop' / 'icon.ico',sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
