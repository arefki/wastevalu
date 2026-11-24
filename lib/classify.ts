import * as tf from '@tensorflow/tfjs';
import { CLASS_NAMES } from './data';
import type { Category, Prediction } from './types';

const MODEL_URL = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/model/model.json`;

let modelPromise: Promise<tf.LayersModel> | null = null;

/** Lazily loads the trained MobileNetV2 classifier (9.8 MB, cached by the browser). */
export function loadModel(): Promise<tf.LayersModel> {
  if (!modelPromise) {
    modelPromise = tf
      .loadLayersModel(MODEL_URL)
      .then(async (model) => {
        // Warm-up: compile shaders so the first real inference is fast.
        const dummy = tf.zeros([1, 224, 224, 3]);
        const out = model.predict(dummy) as tf.Tensor;
        await out.data();
        dummy.dispose();
        out.dispose();
        return model;
      })
      .catch((err) => {
        modelPromise = null;
        throw err;
      });
  }
  return modelPromise;
}

/**
 * Classifies an image element. Preprocessing matches training exactly:
 * resize to 224x224, MobileNetV2 preprocess_input (x / 127.5 - 1).
 * Returns all 7 classes sorted by probability, highest first.
 */
export async function classifyImage(img: HTMLImageElement): Promise<Prediction[]> {
  const model = await loadModel();
  const probs = tf.tidy(() => {
    const input = tf.browser
      .fromPixels(img)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(127.5)
      .sub(1)
      .expandDims(0);
    const output = model.predict(input) as tf.Tensor;
    return output.dataSync();
  });
  const ranked: Prediction[] = CLASS_NAMES.map((name, i) => ({
    category: name as Category,
    probability: probs[i],
  }));
  ranked.sort((a, b) => b.probability - a.probability);
  return ranked;
}

export function modelUrl(): string {
  return MODEL_URL;
}
