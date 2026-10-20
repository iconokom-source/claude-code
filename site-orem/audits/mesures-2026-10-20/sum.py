import json,sys,collections
from urllib.parse import urlparse
for f in sys.argv[1:]:
    r=json.load(open(f)); a=r['audits']
    if r.get('runtimeError'): print(f,'ERR',r['runtimeError']); continue
    g=lambda k:a[k].get('displayValue','')
    print(f"{f}: score {round(r['categories']['performance']['score']*100)} | FCP {g('first-contentful-paint')} | LCP {g('largest-contentful-paint')} | TBT {g('total-blocking-time')} | CLS {g('cumulative-layout-shift')} | SI {g('speed-index')} | poids {g('total-byte-weight')}")
    items=a['network-requests']['details']['items']
    by=collections.defaultdict(lambda:[0,0]); dom=collections.defaultdict(int)
    for it in items:
        by[it.get('resourceType')][0]+=1; by[it.get('resourceType')][1]+=it.get('transferSize',0); dom[urlparse(it['url']).netloc]+=it.get('transferSize',0)
    print('   requêtes',len(items),' | ', ', '.join(f"{k}:{v[0]}/{v[1]//1024}Ko" for k,v in sorted(by.items(),key=lambda x:-x[1][1])))
    print('   domaines', ', '.join(f"{k}:{v//1024}Ko" for k,v in sorted(dom.items(),key=lambda x:-x[1])[:8]))
    print('   top', '; '.join(f"{it['url'].split('/')[-1][:50]} {it.get('transferSize',0)//1024}Ko" for it in sorted(items,key=lambda i:-i.get('transferSize',0))[:6]))
    lcp=a.get('largest-contentful-paint-element',{}).get('details',{})
    try: print('   LCP elt', json.dumps(lcp['items'][0]['items'][0]['node']['snippet'])[:200])
    except Exception: pass
    bt=a['bootup-time']['details']['items'][:5]
    print('   JS', '; '.join(f"{i['url'].split('/')[-1][:40] or i['url']} {round(i['total'])}ms" for i in bt))
    print('   mainthread', '; '.join(f"{i['groupLabel']} {round(i['duration'])}ms" for i in a['mainthread-work-breakdown']['details']['items'][:6]))
