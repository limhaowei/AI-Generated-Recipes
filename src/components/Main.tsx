import { useState, useRef, useEffect } from "react"
import Recipe from "./Recipe"
import IngredientsList from "./IngredientsList"
import { getRecipeFromGemini } from "../ai"

const LOADING_MESSAGES = [
    "Raiding the pantry for ideas...",
    "Mixing flavors in my mind...",
    "Searching for the perfect recipe...",
    "Preheating the creative oven...",
    "Tasting virtual ingredients...",
    "Almost ready to serve...",
]

export default function Main() {
    const [ingredients, setIngredients] = useState<string[]>([])
    const [recipe, setRecipe] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

    const recipeSection = useRef(null)

    useEffect(() => {
        if (recipe !== "" && recipeSection.current !== null) {
            (recipeSection.current as HTMLDivElement).scrollIntoView({ behavior: "smooth" })
        }
    }, [recipe])

    useEffect(() => {
        if (!isLoading) return

        const interval = setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
        }, 2000)

        return () => clearInterval(interval)
    }, [isLoading])

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
        setIsLoading(true)
        setLoadingMessageIndex(0)
        const recipeMarkdown = await getRecipeFromGemini(ingredients)
        setIsLoading(false)
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

            {isLoading && (
                <div className="loading-container" aria-live="polite">
                    <div className="loading-spinner" />
                    <p className="loading-message">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                </div>
            )}

            {recipe && <Recipe recipe={recipe} />}
        </main>
    )
}
