'use server';

/**
 * @fileOverview AI flow for generating a recipe from an image of a dish.
 *
 * - generateRecipeFromImage - A function that takes an image of a dish and generates a recipe.
 * - GenerateRecipeFromImageInput - The input type for the generateRecipeFromImage function.
 * - GenerateRecipeFromImageOutput - The return type for the generateRecipeFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeFromImageInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      'An image of a dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});
export type GenerateRecipeFromImageInput = z.infer<typeof GenerateRecipeFromImageInputSchema>;

const GenerateRecipeFromImageOutputSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of ingredients for the recipe.'),
  instructions: z.array(z.string()).describe('A list of instructions for the recipe.'),
  servingSuggestions: z.string().describe('Serving suggestions for the recipe.'),
});
export type GenerateRecipeFromImageOutput = z.infer<typeof GenerateRecipeFromImageOutputSchema>;

export async function generateRecipeFromImage(
  input: GenerateRecipeFromImageInput
): Promise<GenerateRecipeFromImageOutput> {
  return generateRecipeFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipeFromImagePrompt',
  input: {schema: GenerateRecipeFromImageInputSchema},
  output: {schema: GenerateRecipeFromImageOutputSchema},
  prompt: `You are an expert chef who can generate recipes from images of dishes.

  Analyze the following image and generate a recipe, including ingredients, instructions, and serving suggestions.

  Here is the image:
  {{media url=imageUri}}
  `,
});

const generateRecipeFromImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromImageFlow',
    inputSchema: GenerateRecipeFromImageInputSchema,
    outputSchema: GenerateRecipeFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
