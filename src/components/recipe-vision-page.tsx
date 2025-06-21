"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { getIngredientsAction, generateRecipeAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, UploadCloud, Loader, UtensilsCrossed, Soup, Salad, BookOpen, CircleHelp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Step = "upload" | "confirm" | "recipe";
type Recipe = {
  formattedRecipe: string;
  servingSuggestions: string;
};

export default function RecipeVisionPage() {
  const [step, setStep] = useState<Step>("upload");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [confirmedIngredients, setConfirmedIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImageDataUrl(dataUrl);
        startTransition(async () => {
          try {
            const result = await getIngredientsAction(dataUrl);
            if (result.error) {
              throw new Error(result.error);
            }
            setIngredients(result.ingredients || []);
            setConfirmedIngredients(result.ingredients || []);
            setStep("confirm");
          } catch (e: any) {
            setError(e.message || "Failed to identify ingredients.");
            setStep("upload");
            toast({
              variant: "destructive",
              title: "Error",
              description: e.message || "Failed to identify ingredients from the image.",
            });
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientToggle = (ingredient: string) => {
    setConfirmedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleGenerateRecipe = () => {
    if (!imageDataUrl || confirmedIngredients.length === 0) {
      setError("Something went wrong. Please start over.");
      return;
    }
    setError(null);
    setStep('recipe');
    startTransition(async () => {
      try {
        const result = await generateRecipeAction(imageDataUrl, confirmedIngredients);
        if (result.error) {
          throw new Error(result.error);
        }
        setRecipe(result.recipe || null);
      } catch (e: any) {
        setError(e.message || "Failed to generate recipe.");
        setStep("confirm"); // Go back to confirmation step on error
         toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Failed to generate the recipe. Please try again.",
        });
      }
    });
  };

  const handleStartOver = () => {
    setStep("upload");
    setImageDataUrl(null);
    setIngredients([]);
    setConfirmedIngredients([]);
    setRecipe(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <div className="flex justify-center items-center gap-4">
           <ChefHat className="h-12 w-12 text-primary" />
           <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-primary">
            Recipe Vision
           </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground font-body">
          Upload a photo of a dish and get a recipe in seconds.
        </p>
      </header>

      <main className="w-full max-w-4xl">
        <Card className="w-full shadow-lg transition-all duration-500">
            {step === 'upload' && (
                 <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <UploadCloud className="w-16 h-16 text-primary/50 mb-4" />
                    <h2 className="text-2xl font-headline font-semibold mb-2">Upload Your Dish</h2>
                    <p className="text-muted-foreground mb-6">Let's see what you've been cooking (or eating)!</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        className="hidden"
                        id="image-upload"
                    />
                    <Button asChild size="lg">
                        <Label htmlFor="image-upload" className="cursor-pointer">
                            {isPending ? <> <Loader className="mr-2 h-4 w-4 animate-spin" /> Processing... </> : "Choose an Image"}
                        </Label>
                    </Button>
                    {isPending && <p className="text-sm text-muted-foreground mt-4">Analyzing image...</p>}
                 </CardContent>
            )}

            {step === 'confirm' && imageDataUrl && (
                 <CardContent className="p-8">
                    <h2 className="text-2xl font-headline font-semibold mb-4 text-center">Confirm Ingredients</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md">
                            <Image src={imageDataUrl} alt="Uploaded dish" layout="fill" objectFit="cover" />
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-4">We've identified these ingredients. Uncheck any that aren't correct.</p>
                             <div className="space-y-3 max-h-60 overflow-y-auto pr-2 rounded-md border p-4">
                                {ingredients.map((ingredient) => (
                                    <div key={ingredient} className="flex items-center space-x-3">
                                        <Checkbox
                                            id={ingredient}
                                            checked={confirmedIngredients.includes(ingredient)}
                                            onCheckedChange={() => handleIngredientToggle(ingredient)}
                                        />
                                        <Label htmlFor={ingredient} className="text-base capitalize cursor-pointer">{ingredient}</Label>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-between items-center">
                                <Button variant="outline" onClick={handleStartOver}>Start Over</Button>
                                <Button onClick={handleGenerateRecipe} disabled={isPending || confirmedIngredients.length === 0}>
                                    {isPending ? <> <Loader className="mr-2 h-4 w-4 animate-spin" /> Generating... </> : <> <UtensilsCrossed className="mr-2 h-4 w-4" /> Generate Recipe </>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
            
            {step === 'recipe' && (
                <CardContent className="p-8">
                    {isPending && !recipe && (
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                            <Loader className="w-16 h-16 text-primary animate-spin mb-4" />
                            <h2 className="text-2xl font-headline font-semibold mb-2">Crafting your recipe...</h2>
                            <p className="text-muted-foreground">Our AI chef is working its magic!</p>
                        </div>
                    )}
                    {recipe && (
                        <div className="animate-in fade-in-50 duration-500">
                             <h2 className="text-3xl font-headline font-bold mb-6 text-center text-primary">Here's Your Recipe!</h2>
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1">
                                    {imageDataUrl && <Image src={imageDataUrl} alt="Uploaded dish" width={400} height={400} className="rounded-lg shadow-md w-full" />}
                                    <Card className="mt-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Salad className="text-accent"/>Serving Suggestions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">{recipe.servingSuggestions}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="lg:col-span-2">
                                     <Card>
                                        <CardHeader>
                                             <CardTitle className="flex items-center gap-2"><BookOpen className="text-primary"/>Recipe</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="prose prose-lg max-w-none font-body" dangerouslySetInnerHTML={{ __html: recipe.formattedRecipe.replace(/\n/g, '<br />') }} />
                                        </CardContent>
                                     </Card>
                                </div>
                             </div>
                             <div className="mt-8 text-center">
                                 <Button onClick={handleStartOver}>Create Another Recipe</Button>
                             </div>
                        </div>
                    )}
                </CardContent>
            )}

            {error && (
              <Alert variant="destructive" className="m-8">
                <CircleHelp className="h-4 w-4" />
                <AlertTitle>An Error Occurred</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
        </Card>
      </main>
    </div>
  );
}
