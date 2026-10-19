"""Genera la maqueta estática de la propuesta «La válida impresa» para /copa-valle-yumbo-2026 (v6: títulos y botones del sitio).

v5 aplica el checklist «anti-aspecto-de-IA» de la investigación (investigacion-skills-tendencias.md §5): sin
antetítulos en mayúsculas ni cadenas con punto medio, sin palabra resaltada en los titulares, sin sombras duras
desplazadas ni levantar cada tarjeta, sin flechas decorativas, un solo elemento enorme por pantalla, aliados en un
solo pliego (no 24 tarjetas) y las cifras como planilla con una sola cifra gigante.

No es la implementación: es un HTML suelto con datos reales (aliados, cifras históricas, mangas, el trazado del GPX)
y las fotos de la vista previa, para que el usuario vea la dirección antes de tocar el sitio.

Uso (desde esta carpeta, con el python3 del sistema, que tiene Pillow): python3 -I maqueta.py
"""
import html
import json
import math
import os

PAGE = '/Users/juadiga/Documents/Personal/Trocha y Ruta/page'
OUT = os.path.join(PAGE, 'claudedocs/valida-yumbo-2026/web/rediseno-16-oct/maqueta')
A = os.path.join(OUT, 'assets')

aliados = json.load(open(os.path.join(PAGE, 'src/data/valida-yumbo-2026/aliados.json'), encoding='utf8'))
datos = json.load(open(os.path.join(PAGE, 'src/data/valida-yumbo-2026/datos.json'), encoding='utf8'))
prueba = json.load(open(os.path.join(PAGE, 'src/data/valida-yumbo-2026/preview/datos.json'), encoding='utf8'))['edicion2026']
mangas = json.load(open(os.path.join(PAGE, 'src/data/valida-yumbo-2026/mangas.json'), encoding='utf8'))['groups']
evento = json.load(open(os.path.join(PAGE, 'src/data/valida-yumbo-2026/evento.json'), encoding='utf8'))
fotos = json.load(open(os.path.join(A, 'fotos', 'fotos.json'), encoding='utf8'))
lineas = open(os.path.join(A, 'pista-path.txt'), encoding='utf8').read().strip().split('\n')
pista_vb, pista_d, pista_ini = lineas[0], lineas[1], lineas[2].split()

e = html.escape
orden = sorted(aliados, key=lambda a: a['name'].lower().replace('á', 'a'))
patrocinio = [a for a in orden if a['role'] == 'patrocinio']
apoyo = [a for a in orden if a['role'] == 'apoyo']
total = len(aliados)

IG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" '
      'stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" '
      'stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg>')
EXTERNO = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" '
           'stroke="currentColor" stroke-width="2.4"/></svg>')
LUPA = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" '
        'stroke="currentColor" stroke-width="2.6"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.6" '
        'stroke-linecap="round"/></svg>')


def ancho_logo(ratio, lado=46.0, max_w=88.0, max_h=62.0):
    """Ancho en % de la casilla para igualar el área (como `equalAreaWidth` en valida.ts)."""
    w = lado * math.sqrt(ratio)
    w = min(w, max_w, max_h * ratio)
    return round(w, 1)


def logo(a):
    return (f'<img src="assets/logos/{a["id"]}-320.webp" alt="{e(a["name"])}" '
            f'style="width:{ancho_logo(a["logoRatio"])}%" loading="lazy">')


franja = '\n'.join(f'<li>{logo(a)}</li>' for a in orden)


def aliado(a):
    if a.get('instagram'):
        enlace = f'<span class="aliado__handle">{IG}@{e(a["instagram"])}</span>'
    elif a.get('url'):
        enlace = f'<span class="aliado__handle">{EXTERNO}Sitio web</span>'
    else:
        enlace = ''
    tag = f'<span class="aliado__tag">{e(a["tagline"])}</span>' if a.get('tagline') and a['role'] == 'apoyo' else ''
    abre, cierra = ('<a class="aliado__enlace" href="#">', '</a>') if enlace else ('<div class="aliado__enlace">', '</div>')
    return f'''<li class="aliado">{abre}
  <span class="aliado__logo">{logo(a)}</span>
  <span class="aliado__nombre">{e(a["name"])}</span>{tag}{enlace}
{cierra}</li>'''


muro_p = '\n'.join(aliado(a) for a in patrocinio)
muro_a = '\n'.join(aliado(a) for a in apoyo)

por_grupo = {}
for f in fotos:
    por_grupo.setdefault(f['group'], []).append(f)


def tira(grupo, n, marcar=None, desde=0):
    out = []
    for i, f in enumerate(por_grupo[grupo][desde:desde + n]):
        marca = ' cuadro--foco' if marcar == i else ''
        out.append(f'<li class="cuadro{marca}"><a href="#"><img src="assets/fotos/thumb-{f["id"]}.webp" '
                   f'alt="Foto {i + 1} de la manga" loading="lazy" width="{f["w"]}" height="{f["h"]}"></a></li>')
    return '\n'.join(out)


conteo = {'previa': 20, 'manga-1': 40, 'manga-2': 60, 'manga-3': 95, 'manga-4': 50, 'manga-5': 70, 'manga-6': 60, 'premiacion': 25}
placas = '\n'.join(
    f'<li><button class="chip{" chip--activo" if g["id"] == "todas" else ""}" aria-pressed="{"true" if g["id"] == "todas" else "false"}">'
    f'{e(g["chip"])}<span class="chip__n">{conteo.get(g["id"], 420)}</span></button></li>'
    for g in [{'id': 'todas', 'chip': 'Todas'}] + mangas
)
m3 = next(g for g in mangas if g['id'] == 'manga-3')
m1 = next(g for g in mangas if g['id'] == 'manga-1')

# Planillas: la edición 2026 (prueba) y el histórico (real), sin la cifra de las edades, que es el titular.
edicion = [
    ('Municipios que llegaron a la salida', f'{prueba["municipios"]}', f'de {prueba["departamentos"]} departamentos'),
    ('Niños y niñas de hasta 12 años', f'{prueba["ninosHasta12"]}', ''),
    ('Final más ajustado', '2 s', 'infantil A'),
    ('Clubes y escuelas', f'{prueba["clubes"]}', ''),
    ('Categorías', f'{prueba["categorias"]}', ''),
    ('Mujeres en competencia', f'{prueba["mujeres"]}', ''),
    ('Terminaron', f'{prueba["terminaron"]}', ''),
    ('De los 33 que corrieron las tres, volvieron', f'{prueba["fieles33Volvieron"]}', 'de 33'),
    ('Podios del club en casa', f'{prueba["podiosClub"]}', ''),
]


def fila(k, v, nota=''):
    nota_html = f'<span class="pl__nota">{e(nota)}</span>' if nota else ''
    return (f'<li><span class="pl__k">{e(k)}{nota_html}</span><span class="pl__lider" aria-hidden="true"></span>'
            f'<span class="pl__v">{e(v)}</span></li>')


edicion_html = '\n'.join(fila(*r) for r in edicion)
edades = next(h for h in datos['historico'] if h['id'] == 'edades')
hist_filas = []
for h in datos['historico']:
    if h['id'] == 'edades':
        continue
    valor = f'{h["prefix"].lower()} {h["value"]}' if h.get('prefix') else h['value']
    if h.get('suffix'):
        valor = f'{h["value"]} {h["suffix"]}'
    hist_filas.append(fila(h['label'][0].upper() + h['label'][1:], valor, h['note']))
    if h['id'] == 'terminan':
        puntos = ''.join(f'<i class="{"lleno" if i < 96 else ""}"></i>' for i in range(100))
        hist_filas.append(f'<li class="cien" aria-hidden="true">{puntos}</li>')
historico_html = '\n'.join(hist_filas)

instituciones = ', '.join(e(i) for i in evento['institutions'][:-1]) + ' y ' + e(evento['institutions'][-1])

HTML = f'''<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Maqueta · La válida impresa · /copa-valle-yumbo-2026</title>
<link rel="stylesheet" href="maqueta.css">
</head>
<body>

<p class="aviso-maqueta">Maqueta de propuesta. Fotos y cifras de 2026 de prueba; no es la página real.</p>

<header class="sitio">
  <a class="sitio__logo" href="#"><img src="assets/logo-trocha-y-ruta.webp" alt="Trocha y Ruta"></a>
  <nav class="sitio__nav" aria-label="Principal"><a>Inicio</a><a>Quiénes Somos</a><a>Programas</a><a>Noticias</a><a>Calendario</a><a>Más</a></nav>
  <a class="sitio__cta">Clase de prueba gratis</a>
</header>

<main>

<!-- 1. EL AFICHE: un solo elemento enorme (el título sobre el cerro) -->
<section class="afiche" aria-labelledby="titulo">
  <picture class="afiche__arte">
    <source media="(max-width: 700px)" srcset="assets/cerro-vertical-640.webp 640w, assets/cerro-vertical-780.webp 780w" sizes="100vw">
    <img src="assets/cerro-ancho-1440.webp" srcset="assets/cerro-ancho-1440.webp 1440w, assets/cerro-ancho-2400.webp 2400w" sizes="100vw" alt="" fetchpriority="high">
  </picture>
  <div class="afiche__cabeza">
    <nav class="migas" aria-label="Ruta"><a>Inicio</a><span aria-hidden="true">/</span><a>Calendario</a><span aria-hidden="true">/</span><b>VI Válida, Yumbo</b></nav>
    <p class="ceja">Copa Valle 2026 · VI Válida</p>
    <h1 id="titulo" class="t-h1"><span class="marca">Tus fotos</span> de la VI Válida en Yumbo</h1>
    <p class="afiche__rotulo">Domingo 18 de octubre · Pista Carlos Castro</p>
  </div>
  <div class="letrero" aria-hidden="true"><span>Y</span><span>U</span><span>M</span><span>B</span><span>O</span></div>
  <div class="afiche__pie">
    <p class="afiche__promesa"><span class="afiche__n">420</span> fotos oficiales, gratis y en calidad original gracias a {total} aliados.</p>
    <div class="afiche__acciones">
      <a class="btn btn--accent btn--lg" href="#fotos">{LUPA}Buscar mis fotos</a>
      <a class="btn btn--outline-claro btn--lg" href="#">Resultados oficiales</a>
    </div>
  </div>
</section>

<!-- 2. LA FRANJA DEL AFICHE (la de hoy, con la tipografía del concepto) -->
<section class="franja" aria-labelledby="franja-t">
  <div class="franja__papel">
    <p id="franja-t" class="franja__titulo">Con el patrocinio y el apoyo de</p>
    <ul class="franja__logos" style="--cols:{math.ceil(total / 2)}">
{franja}
    </ul>
  </div>
  <a class="franja__banda" href="#aliados">
    <span class="franja__n">{total}</span>
    <span class="franja__frase">aliados le apostaron a esta válida</span>
    <span class="btn btn--accent">Conócelos ↓</span>
  </a>
</section>

<!-- 3. LA GALERÍA: la tarea. Controles sencillos; el estilo vive en el cabezote de cada manga. -->
<section class="fotos" id="fotos" aria-labelledby="fotos-t">
  <div class="envoltura">
    <header class="cab">
      <p class="ceja">Fotos oficiales</p>
      <h2 id="fotos-t" class="t-h2">Encuentra a tu deportista <span class="marca">por categoría</span></h2>
      <p class="cab__bajada">Toca su categoría o escribe su número de placa, abre la foto y descárgala. Fotos de Fotógrafo de prueba.</p>
    </header>
    <div class="barra">
      <label class="buscar-placa"><span>Número de placa</span><input inputmode="numeric" placeholder="Ej. 214" aria-label="Número de placa"></label>
      <ul class="chips">
{placas}
      </ul>
    </div>

    <article class="contacto">
      <header class="contacto__cab">
        <h3 class="t-h3">Infantil</h3>
        <p class="contacto__meta">Manga 3 · Infantil A y B, salida a las {e(m3['start'])}</p>
      </header>
      <ul class="contacto__tira">
{tira('manga-3', 10, marcar=2)}
      </ul>
      <a class="btn btn--secundario" href="#">Ver las 95 fotos</a>
    </article>

    <article class="contacto">
      <header class="contacto__cab">
        <h3 class="t-h3">Teteros</h3>
        <p class="contacto__meta">Manga 1 · Teteros sin pedales y con pedales, salida a las {e(m1['start'])}</p>
      </header>
      <ul class="contacto__tira">
{tira('manga-1', 4)}
{tira('manga-4', 4)}
      </ul>
      <a class="btn btn--secundario" href="#">Ver las 40 fotos</a>
    </article>

    <div class="letra-chica" role="note">
      <h3>Sobre estas fotos</h3>
      <p>Las publica el Club Deportivo Trocha y Ruta, operador de la válida, para que cada familia tenga las suyas. No publicamos nombres de deportistas. Puedes guardarlas y compartirlas; no se pueden vender ni usar en publicidad. ¿Sales en una foto y prefieres que no esté? Escríbenos y la retiramos el mismo día.</p>
    </div>
  </div>
</section>

<!-- 4. EL MURO: el capítulo oscuro. Todos los aliados en un solo pliego impreso. -->
<section class="muro" id="aliados" aria-labelledby="muro-t">
  <div class="muro__trama" aria-hidden="true"></div>
  <div class="envoltura">
    <p class="ceja ceja--oscura">Aliados</p>
    <h2 id="muro-t" class="t-h2 t-h2--claro">Gracias a quienes <span class="marca marca--oscura">le apostaron</span> a la válida</h2>
    <p class="muro__bajada">Por ellos las fotos de esta página son gratis para todas las familias. Van en orden alfabético.</p>
    <div class="pliego">
      <span class="pliego__corte" aria-hidden="true"></span>
      <h3 class="rotulo">Con el patrocinio de</h3>
      <ul class="aliados">
{muro_p}
      </ul>
      <h3 class="rotulo">Con el apoyo de</h3>
      <ul class="aliados aliados--apoyo">
{muro_a}
      </ul>
    </div>
    <h3 class="rotulo rotulo--oscuro">Con el respaldo de</h3>
    <p class="respaldo">{instituciones}.</p>
    <a class="btn btn--outline-claro" href="#">¿Tu marca en la próxima?</a>
  </div>
</section>

<!-- 5. RESULTADOS: el talón -->
<section class="resultados" aria-labelledby="res-t">
  <div class="envoltura">
    <a class="talon" href="#">
      <span class="talon__lomo" aria-hidden="true">Copa Valle 2026</span>
      <span class="talon__cuerpo">
        <span id="res-t" class="t-h3">Resultados oficiales</span>
        <span class="talon__de">Los publica la Comisión Vallecaucana de Ciclomontañismo.</span>
      </span>
      <span class="talon__ir">Ver{EXTERNO}</span>
    </a>
  </div>
</section>

<!-- 6. LA PLANILLA: una sola cifra gigante; lo demás, como planilla de cronometraje -->
<section class="planilla" id="cifras" aria-labelledby="cifras-t">
  <div class="envoltura">
    <p class="ceja">Yumbo en cifras</p>
    <h2 id="cifras-t" class="t-h2">De 4 a más de 60 años en la <span class="marca">misma pista</span></h2>
    <p class="planilla__dato" aria-hidden="true"><span class="planilla__n">{e(edades["value"])}</span> <span class="planilla__frase">{e(edades["label"])}</span></p>
    <div class="planillas">
      <section class="pl-bloque" aria-labelledby="pl-2026">
        <h3 id="pl-2026" class="pl-bloque__t">La edición 2026 <span>(datos de prueba)</span></h3>
        <ol class="pl">
{edicion_html}
        </ol>
      </section>
      <section class="pl-bloque" aria-labelledby="pl-hist">
        <h3 id="pl-hist" class="pl-bloque__t">{e(datos["historicoTitulo"])}</h3>
        <ol class="pl">
{historico_html}
        </ol>
      </section>
    </div>
    <p class="fuente">{e(datos["source"])}</p>
  </div>
</section>

<!-- 7. LA PISTA: el trazado real -->
<section class="pista" id="la-pista" aria-labelledby="pista-t">
  <div class="envoltura pista__grid">
    <div class="pista__texto">
      <h2 id="pista-t" class="t-h2">La pista de los <span class="marca">Juegos Nacionales</span> y los Panamericanos Junior</h2>
      <p class="pista__bajada">Desde 2012 la Copa Valle se corre en Pizarro.</p>
      <figure class="pista__foto"><img src="assets/historia-pista.webp" alt="Valla de la Pista XCO Carlos Castro" loading="lazy"></figure>
      <ol class="hitos">
        <li><span class="hitos__a">2012</span><span class="hitos__t">La primera válida en casa</span><span class="hitos__d">Con el aval de la Liga Vallecaucana, la pista de Pizarro recibe su primera válida de la Copa Valle.</span></li>
        <li><span class="hitos__a">2019</span><span class="hitos__t">Subsede de los Juegos Nacionales</span><span class="hitos__d">La Comisión Nacional rediseña la pista y elige a Yumbo como subsede del cross country.</span></li>
        <li><span class="hitos__a">2021</span><span class="hitos__t">Los Panamericanos Junior pasan por Pizarro</span><span class="hitos__d">La pista acoge el ciclismo de montaña de los I Juegos Panamericanos Junior Cali-Valle.</span></li>
      </ol>
      <a class="btn btn--outline" href="#">Conoce la pista</a>
    </div>
    <figure class="pista__mapa">
      <svg viewBox="0 0 {pista_vb}" aria-hidden="true">
        <path class="trazo-lima" d="{pista_d}"/>
        <path class="trazo" d="{pista_d}"/>
        <circle class="meta" cx="{pista_ini[0]}" cy="{pista_ini[1]}" r="16"/>
      </svg>
      <figcaption>Una vuelta a la pista, grabada con GPS el 5 de septiembre de 2026. Salida y meta en el punto lima.</figcaption>
    </figure>
  </div>
</section>

<!-- 8. EL CIERRE: una escena, no un pie de columnas -->
<section class="cierre" aria-label="Próximos pasos">
  <div class="envoltura cierre__grid">
    <div>
      <p class="ceja">Próxima parada</p>
      <h2 class="t-h2">VII Válida Copa Valle 2026 – Roldanillo</h2>
      <p class="cierre__fecha">7 y 8 de noviembre de 2026 · Sendero Eco-parque</p>
      <a class="enlace-tinta" href="#">Ver en el calendario</a>
    </div>
    <div class="cierre__hoja">
      <h3 class="t-h3 t-h3--grande">Tu hijo o tu hija puede empezar desde los 4 años</h3>
      <p class="cierre__bajada">La primera clase es de prueba y no tiene costo.</p>
      <div class="cierre__acciones"><a class="btn btn--accent btn--lg" href="#">Clase de prueba gratis</a><a class="btn btn--outline-tinta btn--lg" href="#">Preguntar por WhatsApp</a></div>
    </div>
  </div>
</section>

</main>
<footer class="pie">Pie del sitio, sin cambios (con su silueta de elevación sobre el cierre).</footer>
</body>
</html>
'''

open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(HTML)
print('maqueta escrita', len(HTML))
