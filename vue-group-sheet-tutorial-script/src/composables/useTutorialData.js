import { computed, ref } from "vue";

export function useTutorialData() {
  const uploadedTutorial = ref(null);
  const uploadError = ref("");

  const phaseCount = computed(() => uploadedTutorial.value?.phases?.length || 0);
  const stepCount = computed(() => uploadedTutorial.value?.steps?.length || 0);

  const loadTutorialFile = async (file) => {
    uploadError.value = "";

    if (!file) {
      uploadedTutorial.value = null;
      return;
    }

    try {
      const text = await file.text();
      uploadedTutorial.value = JSON.parse(text);
    } catch (error) {
      uploadedTutorial.value = null;
      uploadError.value = `No se pudo leer el archivo: ${error.message}`;
    }
  };

  return {
    uploadedTutorial,
    uploadError,
    phaseCount,
    stepCount,
    loadTutorialFile,
  };
}
