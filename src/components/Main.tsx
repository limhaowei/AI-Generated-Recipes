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

const STORAGE_KEY = "chef-claude-ingredients"

export default function Main() {
    const [ingredients, setIngredients] = useState<string[]>([])
    const [recipe, setRecipe] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const recipeSection = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            setIngredients(JSON.parse(saved))
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

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
        setError(null)
        try {
            const recipeMarkdown = await getRecipeFromGemini(ingredients)
            if (recipeMarkdown) {
                setRecipe(recipeMarkdown)
            }
        } catch {
            setError("Failed to generate recipe. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    function handleTryAgain() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
        window.location.reload()
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

            {error && (
                <div className="error-container" aria-live="assertive">
                    <p className="error-message">{error}</p>
                    <button type="button" onClick={handleTryAgain}>Try Again</button>
                </div>
            )}

            {recipe && <Recipe recipe={recipe} />}
        </main>
    )
}
