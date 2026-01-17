import ReactMarkdown from 'react-markdown'

interface RecipeProps {
    recipe: string;
}

export default function Recipe(props: RecipeProps) {
    return (
        <section className="suggested-recipe-container" aria-live="polite">
            <h2>Chef Gemini Recommends</h2>
            <ReactMarkdown>
                {props.recipe}
            </ReactMarkdown>
        </section>
    )
}
