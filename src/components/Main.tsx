import { useState, useRef, useEffect } from "react"
import Recipe from "./Recipe"
import IngredientsList from "./IngredientsList"
import { getRecipeFromGemini } from "../ai"

export default function Main() {
    const [ingredients, setIngredients] = useState<string[]>([])
    const [recipe, setRecipe] = useState<string>("")

    const recipeSection = useRef(null)

    useEffect(() => {
        if(recipe !== "" && recipeSection.current !== null){
            (recipeSection.current as HTMLDivElement).scrollIntoView({behavior:"smooth"})
        }
    }, [recipe])

    function addIngredient(formData: FormData) {
        const newIngredient = formData.get("ingredient") as string
        setIngredients(prevIngredients => [...prevIngredients, newIngredient])
    }

    function displaySection() {
        return (
            ingredients.length > 0 && <IngredientsList ref={recipeSection} ingredients={ingredients} showRecipe={showRecipe} />
        )
    }

    async function showRecipe() {
        const recipeMarkdown = await getRecipeFromGemini(ingredients)
        if (recipeMarkdown) {
            setRecipe(recipeMarkdown)
        }
    }

    return (
        <main>
            <form action={addIngredient} className="add-ingredient-form">
                <input
                    aria-label="Add ingredient"
                    type="text"
                    placeholder="e.g. oregano"
                    name="ingredient"
                />
                <button>Add Ingredient</button>
            </form>

            {displaySection()}

            {recipe && <Recipe recipe={recipe} />}
        </main>
    )
}
