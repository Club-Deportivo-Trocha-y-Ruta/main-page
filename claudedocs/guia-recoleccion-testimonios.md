# Guía de recolección de testimonios — familias Trocha y Ruta

**Objetivo**: pasar de 3 a 6 testimonios reales publicados. Los tres nuevos los tiene que aportar el club;
la página ya está lista para recibirlos (grilla de 2 columnas, avatar de iniciales, badge de programa).

## A quién pedirle

Buscar variedad, no cantidad. La combinación ideal:

| Perfil | Por qué importa | Programa |
|--------|-----------------|----------|
| Mamá o papá de un "tetero" que entró hace menos de un año | Responde el miedo de quien está decidiendo hoy | Escuela de Iniciación |
| Familia con dos o más hijos en el club | Habla de logística real y de ambiente familiar | Formación Juvenil |
| Corredor o corredora de 13-16 años | Voz propia del deportista, no solo del adulto | Alto Rendimiento |

Evitar tres testimonios del mismo programa o de la misma familia.

## Cómo pedirlo (mensaje de WhatsApp)

> Hola [nombre] 👋 Estamos armando la nueva página del club y queremos que las familias cuenten cómo ha
> sido la experiencia, con sus propias palabras. ¿Nos ayudas con tres preguntas cortas? Puedes responder
> por escrito o mandarnos una nota de voz, lo que te quede más fácil. Publicaríamos tu nombre y el programa
> de tu hijo/a, nada más.

## Las tres preguntas

1. **¿Qué te preocupaba antes de inscribir a tu hijo o hija en el club?**
   (Saca el miedo real: seguridad, edad, costo, si le iba a gustar. Es lo que otra familia va a leer buscándose a sí misma.)
2. **¿Qué cambió en él o ella desde que entró?**
   (Pedir algo concreto, no adjetivos: "ahora arregla su propia cadena", "duerme mejor", "hizo amigos del colegio de al lado".)
3. **¿Qué le dirías a una familia que está pensando en inscribirse?**
   (Este es el que se publica como frase destacada.)

Para el corredor juvenil, cambiar la 1 por: *¿Cómo era tu primer día en el club?*

## Reglas de edición

- **No inventar ni maquillar.** Se corrige ortografía y se recorta, nunca se reescribe la idea.
- Frase destacada (`quote`): **máximo 200 caracteres**, una sola idea, en la voz de la persona.
- Cuerpo del testimonio: 2-3 párrafos con lo que dio la entrevista.
- Confirmar con la persona el texto final antes de publicar. Un "sí, así está bien" por WhatsApp basta y queda como registro.
- **Foto**: solo si hay autorización de imagen firmada (ver T3.1). Sin foto, la página muestra iniciales sobre
  fondo teal — se ve intencional, no como un hueco.

## Cómo se publica

Un archivo por testimonio en `src/content/testimonials/nombre-apellido.md`:

```markdown
---
name: "Nombre Apellido"
type: "familia"
role: "madre-de-familia"      # padre-de-familia | corredor-juvenil | exalumno...
roleLabel: "Madre de familia"
quote: "La frase destacada, máximo 200 caracteres."
relatedProgram: "escuela-de-iniciacion"   # id del archivo en src/content/programs/
featured: false
order: 4
draft: false
---

Primer párrafo con la respuesta a la pregunta 1.

Segundo párrafo con la respuesta a la pregunta 2.
```

`order` define la posición: los nuevos entran como 4, 5 y 6.
