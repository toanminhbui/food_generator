"use client";

import * as React from "react";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";

interface Recipe {
  label: string;
  image: string;
  source: string;
  ingredientLines: string[];
  url: string;
  calories: number;
}

interface Hit {
  recipe: Recipe;
}

interface ApiResponse {
  hits: Hit[];
}

export default function Home() {
  React.useEffect(() => {
    import('ldrs').then(mod => {
      mod.dotWave.register();
    });
  }, []);
  const [meal, setMeal] = React.useState<string>("Breakfast");
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const items = [
    {
      id: "dairy-free",
      label: "dairy-free",
    },
    {
      id: "gluten-free",
      label: "gluten-free",
    },
    {
      id: "crustacean-free",
      label: "crustacean-free",
    },
    {
      id: "red-meat-free",
      label: "red-meat-free",
    },
    {
      id: "vegetarian",
      label: "vegetarian",
    },
    {
      id: "shellfish-free",
      label: "shellfish-free",
    },
  ] as const;

  const diets = [
    {
      id: "high-protein",
      label: "high-protein",
    },
    {
      id: "low-sodium",
      label: "low-sodium",
    },
    {
      id: "balanced",
      label: "balanced",
    },
  ] as const;

  const FormSchema = z.object({
    items: z.array(z.string()),
    diets: z.array(z.string()),
    cook_time: z.string(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [],
      diets: [],
      cook_time: "1000",
    },
  });

  function buildURL(meal: string, healthItems: string[], dietItems: string[], cook_time:string): string {
    const baseUrl = "https://api.edamam.com/api/recipes/v2";
    const params = new URLSearchParams({
      type: "public",
      app_id: process.env.NEXT_PUBLIC_APP_ID || "",
      app_key: process.env.NEXT_PUBLIC_APP_KEY || "",
      mealType: meal,
      time: cook_time,
      random: "true",
    });

    if (healthItems.length > 0) {
      healthItems.forEach(item => params.append("health", item));
    }

    if (dietItems.length > 0) {
      dietItems.forEach(item => params.append("diet", item));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const url = buildURL(meal, data.items, data.diets, data.cook_time);
    setLoading(true);
    try {
      const response = await fetch(url);
      const result: ApiResponse = await response.json();
      setRecipes(result.hits.map(hit => hit.recipe));
      toast({
        title: "Fetched Recipes:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(result, null, 2)}</code>
          </pre>
        ),
      });
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recipes. Please try again later.",
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center p-8 space-y-8">
      <div className="flex space-x-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{meal}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Choose a mealtime</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={meal} onValueChange={setMeal}>
              <DropdownMenuRadioItem value="Breakfast">Breakfast</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Lunch">Lunch</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Dinner">Dinner</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Snack">Snack</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="items"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Allergies</FormLabel>
                    <FormDescription>Indicate any Allergies</FormDescription>
                  </div>
                  {items.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="items"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diets"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Diet Preferences</FormLabel>
                    <FormDescription>Indicate any diet preferences</FormDescription>
                  </div>
                  {diets.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="diets"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cook_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Cook Time</FormLabel>
                  <FormControl>
                    <Input placeholder="in minutes, ex: 30" {...field} />
                  </FormControl>
                  <FormDescription>
                    leave blank for no preference
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Surprise Me</Button>
          </form>
        </Form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <l-dot-wave size="47" speed="1" color="black"></l-dot-wave>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-8">
          {recipes.map((recipe, index) => (
            <div key={index} className="border p-4 rounded-md shadow-sm">
              <h2 className="text-xl font-bold">{recipe.label}</h2>
              <img src={recipe.image} alt={recipe.label} className="w-full h-auto mb-4"/>
              <p className="text-sm"><strong>Calories:</strong> {recipe.calories.toPrecision(5)}</p>
              <p className="text-sm"><strong>Ingredients:</strong></p>
              <ul className="list-disc list-inside text-sm">
                {recipe.ingredientLines.map((ingredient, idx) => (
                  <li key={idx}>{ingredient}</li>
                ))}
              </ul>
              <Button asChild>
                <Link href={recipe.url}>Go to Recipe</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
