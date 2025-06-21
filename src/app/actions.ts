'use server';

import { confirmIngredients } from '@/ai/flows/ingredient-confirmation';
import { generateRecipeFromImage } from '@/ai/flows/image-to-recipe';
import { selectRecipeFormat } from '@/ai/flows/recipe-format-selection';
import { z } from 'zod';

const GetIngredientsResultSchema = z.object({
  ingredients: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export async function getIngredientsAction(photoDataUri: string): Promise<z.infer<typeof GetIngredientsResultSchema>> {
  try {
    const { ingredients } = await confirmIngredients({ photoDataUri });
    return { ingredients };
  } catch (e: any) {
    console.error(e);
    return { error: 'Could not process the image. Please try another one.' };
  }
}

const GenerateRecipeResultSchema = z.object({
  recipe: z.object({
    formattedRecipe: z.string(),
    servingSuggestions: z.string(),
  }).optional(),
  error: z.string().optional(),
});

export async function generateRecipeAction(photoDataUri: string, confirmedIngredients: string[]): Promise<z.infer<typeof GenerateRecipeResultSchema>> {
  try {
    // First, generate base instructions and serving suggestions from the image.
    const initialRecipe = await generateRecipeFromImage({ imageUri: photoDataUri });

    if (!initialRecipe.instructions || !initialRecipe.servingSuggestions) {
      throw new Error("The AI could not generate a recipe from this image.");
    }
    
    // Then, use the user-confirmed ingredients to format the recipe.
    const formattedData = await selectRecipeFormat({
      photoDataUri,
      ingredients: confirmedIngredients.join('\n'),
      instructions: initialRecipe.instructions.join('\n'),
    });
    
    return {
      recipe: {
        formattedRecipe: formattedData.formattedRecipe,
        servingSuggestions: initialRecipe.servingSuggestions,
      },
    };

  } catch (e: any) {
    console.error(e);
    return { error: 'An unexpected error occurred while generating the recipe.' };
  }
}
