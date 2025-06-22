// Ingredient Confirmation Flow
'use server';

/**
 * @fileOverview Provides a Genkit flow to display a list of potential ingredients identified from an image.
 *
 * - confirmIngredients - A function that takes an image and returns a list of potential ingredients.
 * - ConfirmIngredientsInput - The input type for the confirmIngredients function.
 * - ConfirmIngredientsOutput - The return type for the confirmIngredients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfirmIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type ConfirmIngredientsInput = z.infer<typeof ConfirmIngredientsInputSchema>;

const ConfirmIngredientsOutputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of potential ingredients identified in the image.'),
});
export type ConfirmIngredientsOutput = z.infer<typeof ConfirmIngredientsOutputSchema>;

export async function confirmIngredients(input: ConfirmIngredientsInput): Promise<ConfirmIngredientsOutput> {
  return confirmIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'confirmIngredientsPrompt',
  input: {schema: ConfirmIngredientsInputSchema},
  output: {schema: ConfirmIngredientsOutputSchema},
  prompt: `You are an AI assistant specialized in identifying ingredients from food images.
  Analyze the provided image and extract a list of potential ingredients. Return the ingredients as a JSON array of strings.

  Image: {{media url=photoDataUri}}
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const confirmIngredientsFlow = ai.defineFlow(
  {
    name: 'confirmIngredientsFlow',
    inputSchema: ConfirmIngredientsInputSchema,
    outputSchema: ConfirmIngredientsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
