<template>
  <section class="panel">
    <div class="panel-heading">
      <p class="eyebrow">Ejecución</p>
      <h2>Checklist</h2>
      <p class="panel-lead">
        El runner Node genera capturas, GIFs y el HTML final. La UI en Vue sirve como panel de referencia y visor ligero del resultado.
      </p>
    </div>

    <ol class="checklist">
      <li>Instala dependencias dentro de <code>vue-group-sheet-tutorial</code>.</li>
      <li>Rellena <code>.env</code> con <code>BASE_URL</code>, <code>OPENAI_API_KEY</code> y un modelo soportado.</li>
      <li>Lanza la app principal de Group Sheet Editor.</li>
      <li>Ejecuta <code>npm run tutorial:run</code> para producir <code>output/tutorial.html</code>.</li>
      <li>Si quieres revisar los datos en esta UI, carga <code>output/tutorial-data.json</code>.</li>
    </ol>
  </section>
</template>
