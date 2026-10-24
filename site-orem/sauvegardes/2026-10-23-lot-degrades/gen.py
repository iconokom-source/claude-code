import json,math,sys
S='/tmp/claude-0/-home-user-claude-code/4d5f222e-3a5b-5fdc-84ca-2ca11cffb08d/scratchpad/flou/'
C=json.load(open(S+'colors.json'))
sig=float(sys.argv[1]) if len(sys.argv)>1 else 150.0
step=int(sys.argv[2]) if len(sys.argv)>2 else 10
Phi=lambda z:0.5*(1+math.erf(z/math.sqrt(2)))
hx=lambda c:[int(c[i:i+2],16) for i in (1,3,5)]
def overlay(cols,H):
  n=len(cols);rgb=[hx(c) for c in cols];stops=[]
  ys=list(range(0,H,step))+[H]
  for y in ys:
    a=Phi(y/sig)-Phi((y-H)/sig)
    q=[0,0,0]
    for i,c in enumerate(rgb):
      t0,t1=i*H/n,(i+1)*H/n; w=Phi((y-t0)/sig)-Phi((y-t1)/sig)
      for k in range(3): q[k]+=c[k]*w
    col=[min(255,max(0,q[k]/a)) for k in range(3)]
    stops.append(f'rgba({col[0]:.1f},{col[1]:.1f},{col[2]:.1f},{a:.4f}) {y}px')
  return 'linear-gradient(to bottom, '+', '.join(stops)+')'
def mask(direction):
  st=[]
  for x in range(0,4*int(sig)+1,int(sig)//6):
    st.append(f'rgba(0,0,0,{Phi(x/sig):.4f}) {x}px')
  return f'linear-gradient({direction}, '+', '.join(st)+')'
m=mask('to right')+', '+mask('to left')
css=''
for cls,key,H in (('accueil','COLORS',2310),('realisations','COLORS_REALISATIONS',2310),('a-propos','COLORS_APROPOS',1400)):
  css+=f".degrade-hero.{cls}::before{{content:'';position:absolute;inset:0;background:{overlay(C[key],H)};-webkit-mask-image:{m};mask-image:{m};-webkit-mask-composite:source-in;mask-composite:intersect}}\n"
css+=".degrade-hero.a-propos{background-image:linear-gradient(to bottom, "+', '.join(C['COLORS_APROPOS'])+")!important}.degrade-hero.a-propos::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.01)}\n"
open(S+'proto.css','w').write(css);print(len(css))
