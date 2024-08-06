import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore } from './Firebase';
import { doc, getDoc } from 'firebase/firestore';
import './RecipeView.css';

const RecipeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);
      try {
        const recipeRef = doc(firestore, 'products', id);
        const recipeSnap = await getDoc(recipeRef);
        if (recipeSnap.exists()) {
          const data = recipeSnap.data();
          if (data.fileURL && data.foodName && data.username && data.ingredients && data.process) {
            setRecipe(data);
          } else {
            setError('Recipe data is incomplete');
          }
        } else {
          setError('Recipe not found');
        }
      } catch (error) {
        console.error('Error fetching recipe:', error.message);
        setError(`Error fetching recipe: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="recipe-view">
      {recipe ? (
        <>
          <img src={recipe.fileURL} alt={recipe.foodName} className="recipe-img" />
          <h3>Recipe: {recipe.foodName}</h3>
          <p>Uploaded by: {recipe.username}</p>
          <p><strong>Ingredients:</strong> {recipe.ingredients}</p>
          <p><strong>Process:</strong> {recipe.process}</p>
          <button onClick={() => navigate(-1)}>Back</button>
        </>
      ) : (
        <div>Recipe not found</div>
      )}
    </div>
  );
};

export default RecipeView;
