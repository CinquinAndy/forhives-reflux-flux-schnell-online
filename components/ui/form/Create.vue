<template lang="pug">
  .flex.flex-col.gap-y-4
    //- Prompt
    u-form-group(
      label="Prompt"
      name="prompt"
    )
      u-textarea(
        v-model="prompt"
        placeholder="Write a prompt..."
        autoresize
      )
    //- Aspect ratio
    u-form-group(
      label="Aspect ratio"
      name="aspect_ratio"
    )
      u-select-menu(
        v-model="aspect_ratio"
        :options="aspect_ratio_options"
      )
    //- Inference steps
    u-form-group(
      label="Steps"
      name="num_inference_steps"
    )
      .flex.items-center.gap-x-4
        u-range.flex-grow(
          v-model="num_inference_steps"
          :min="1"
          :max="4"
          :step="1"
        )
        u-input.w-24(
          v-model="num_inference_steps"
          type="number"
          min="1"
          max="4"
          step="1"
        )
    //- Output format
    u-form-group(
      label="Output format"
      name="output_format"
    )
      u-select-menu(
        v-model="output_format"
        :options="output_format_options"
      )
    //- Output quality
    u-form-group(
      label="Output quality"
      name="output_quality"
    )
      .flex.items-center.gap-x-4
        u-range.flex-grow(
          v-model="output_quality"
          :min="0"
          :max="100"
          :step="1"
        )
        u-input.w-24(
          v-model="output_quality"
          type="number"
          min="0"
          max="100"
          step="1"
        )
    //- Number of outputs
    u-form-group(
      label="Number of outputs"
      name="num_outputs"
    )
      .flex.items-center.gap-x-4
        u-range.flex-grow(
          v-model="num_outputs"
          :min="1"
          :max="4"
          :step="1"
        )
        u-input.w-24(
          v-model="num_outputs"
          type="number"
          min="1"
          max="4"
          step="1"
        )
    //- Submit
    u-button(
      v-if="replicate_api_token"
      @click="submit"
      :disabled="loading || !replicate_api_token || !prompt"
      :loading="loading"
      size="xl"
      block
    ) Create

    u-alert.dark(
      v-if="!replicate_api_token"
      color="primary"
      variant="solid"
      description="Please add your Replicate API token in the top right."
    )
</template>

<script>
import {useLocalStorage} from '@vueuse/core'
import {mapActions} from 'pinia'
import {usePredictionStore} from '~/stores/prediction'

export default {
  name: 'UiFormCreate',
  setup: () => ({
    replicate_api_token: useLocalStorage('reflux-replicate-api-token', null),
    prompt: useLocalStorage('reflux-prompt', ''),
    aspect_ratio: useLocalStorage('reflux-aspect_ratio', '1:1'),
    num_outputs: useLocalStorage('reflux-num_outputs', 1),
    num_inference_steps: useLocalStorage('reflux-num_inference_steps', 4),
    output_format: useLocalStorage('reflux-output_format', 'webp'),
    output_quality: useLocalStorage('reflux-output_quality', 80),
  }),
  data: () => ({
    loading: false,
    aspect_ratio_options: [
      '1:1', '16:9', '21:9', '3:2', '2:3', '4:5',
      '5:4', '3:4', '4:3', '9:16', '9:21'
    ],
    output_format_options: ['webp', 'jpg', 'png'],
    // Limiter les steps entre 1 et 4 comme spécifié dans le schéma
    max_inference_steps: 4,
    // Limiter le nombre d'outputs entre 1 et 4
    max_outputs: 4,
    // Limiter la qualité à 100 maximum
    max_quality: 100
  }),
  methods: {
    ...mapActions(usePredictionStore, ['createPrediction']),
    async submit() {
      this.loading = true
      try {
        await this.createPrediction({
          input: {
            prompt: this.prompt,
            megapixels: "1",
            num_outputs: this.num_outputs,
            aspect_ratio: this.aspect_ratio,
            output_format: this.output_format,
            output_quality: this.output_quality,
            num_inference_steps: this.num_inference_steps,
            go_fast: true
          }
        })
      } catch (e) {
        console.log('--- (create): error', e.message)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>