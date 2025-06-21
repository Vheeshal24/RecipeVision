'use server';

/**
 * @fileOverview A flow that analyzes a dish image and generated recipe content to select the most appropriate recipe format.
 *
 * - selectRecipeFormat - A function that handles the recipe format selection process.
 * - SelectRecipeFormatInput - The input type for the selectRecipeFormat function.
 * - SelectRecipeFormatOutput - The return type for the selectRecipeFormat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectRecipeFormatInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  ingredients: z.string().describe('A list of ingredients for the recipe.'),
  instructions: z.string().describe('The generated instructions for the recipe.'),
});
export type SelectRecipeFormatInput = z.infer<typeof SelectRecipeFormatInputSchema>;

const SelectRecipeFormatOutputSchema = z.object({
  format: z.enum(['list', 'step-by-step']).describe('The selected recipe format.'),
  formattedRecipe: z.string().describe('The recipe formatted according to the selected format.'),
});
export type SelectRecipeFormatOutput = z.infer<typeof SelectRecipeFormatOutputSchema>;

export async function selectRecipeFormat(input: SelectRecipeFormatInput): Promise<SelectRecipeFormatOutput> {
  return selectRecipeFormatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'selectRecipeFormatPrompt',
  input: {schema: SelectRecipeFormatInputSchema},
  output: {schema: SelectRecipeFormatOutputSchema},
  prompt: `You are an AI expert in recipe formatting. Given a dish and its generated recipe content, you will determine the most appropriate format for the recipe.

You can select between two formats:
- list: A simple list of ingredients and a paragraph of instructions.
- step-by-step: A detailed step-by-step guide with ingredients listed at the beginning.

Consider the image, ingredients and instructions when making your decision. For example, if the instructions are very detailed, a step-by-step format would be more appropriate.

Photo: {{media url=photoDataUri}}
Ingredients: {{{ingredients}}}
Instructions: {{{instructions}}}

Choose the best format and then format the recipe accordingly.

Output in JSON format.
`,
});

const selectRecipeFormatFlow = ai.defineFlow(
  {
    name: 'selectRecipeFormatFlow',
    inputSchema: SelectRecipeFormatInputSchema,
    outputSchema: SelectRecipeFormatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
