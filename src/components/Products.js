import React, { useState, useEffect, useRef } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { auth, firestore, storage } from './Firebase'; // Adjust the path as needed
import { v4 as uuidv4 } from 'uuid'; // Import UUID library
import './Product.css';

function Products() {
  const [file, setFile] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [process, setProcess] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedData, setUploadedData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const lastProgressUpdate = useRef(0);
  const uploadInterval = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        fetchUploadedData(user.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUploadedData = async (userId) => {
    setLoading(true);
    try {
      const q = query(collection(firestore, 'users', userId, 'products'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUploadedData(data);
    } catch (error) {
      console.error('Error fetching uploaded data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) {
        console.error('No user is logged in');
        return;
    }

    if (!file) {
        console.error('No file selected');
        return;
    }

    setLoading(true);
    const userId = user.uid;
    const uniqueProductId = uuidv4(); // Generate a unique ID for the product
    const storageRef = ref(storage, `${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Fetch the user's username from Firestore
    let username = 'Unknown';
    try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
            username = userDoc.data().username || 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching username:', error);
    }

    uploadTask.on(
        'state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

            // Smooth progress updates using a timer
            if (uploadInterval.current) {
                clearInterval(uploadInterval.current);
            }

            uploadInterval.current = setInterval(() => {
                setUploadProgress((prevProgress) => {
                    if (prevProgress >= progress) {
                        clearInterval(uploadInterval.current);
                        return progress;
                    }
                    return prevProgress + 1;
                });
            }, 20);
        },
        (error) => {
            console.error('Error uploading file:', error);
            setLoading(false);
            if (uploadInterval.current) {
                clearInterval(uploadInterval.current);
            }
        },
        async () => {
            const fileURL = await getDownloadURL(uploadTask.snapshot.ref);

            const productData = {
                foodName,
                ingredients,
                process,
                fileURL,
                timestamp: new Date(),
                userId, // Include userId in the product data
                username // Include username
            };

            try {
                // Save the product data under the user's collection with a unique ID
                await setDoc(doc(firestore, 'users', userId, 'products', uniqueProductId), productData);
                // Save the product data in the main products collection with a unique ID
                await setDoc(doc(firestore, 'products', uniqueProductId), productData);

                setLoading(false);
                setSuccessMessage('File uploaded successfully!');
                setShowMessage(true);

                setFile(null);
                setFoodName('');
                setIngredients('');
                setProcess('');
                setImagePreview('');
                setUploadProgress(0);

                fetchUploadedData(userId);

                setTimeout(() => setShowMessage(false), 5000);
            } catch (error) {
                console.error('Error saving metadata:', error);
                setLoading(false);
            }
        }
    );
};



  return (
    <div className="products-container">
      <div className={`success-message ${showMessage ? 'show' : ''}`}>
        {successMessage}
      </div>
      <form className="upload-form" onSubmit={handleUpload}>
        <h2>Upload Recipe</h2>
        <label className="file-input-label">
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="file-input" 
            required 
          />
          <span className="file-input-button">Choose File</span>
        </label>
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Image Preview" />
          </div>
        )}
        <input 
          type="text" 
          placeholder="Food Name" 
          value={foodName} 
          onChange={(e) => setFoodName(e.target.value)} 
          required 
        />
        <textarea 
          placeholder="Ingredients" 
          value={ingredients} 
          onChange={(e) => setIngredients(e.target.value)} 
          required 
        />
        <textarea 
          placeholder="Process" 
          value={process} 
          onChange={(e) => setProcess(e.target.value)} 
          required 
        />
        <button type="submit" className={`upload-btn ${loading ? 'disabled' : ''}`} disabled={loading}>
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          <span>{loading ? `${Math.round(uploadProgress)}%` : 'Upload'}</span>
        </button>
      </form>
    </div>
  );
}

export default Products;
