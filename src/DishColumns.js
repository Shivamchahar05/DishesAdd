import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import './DishColumns.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 


const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DishColumns = () => {
    const [dishes, setDishes] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
    });
    const [userId, setUserId] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [dishName, setDishName] = useState('');
    const [image, setImage] = useState(null);
    const [selectedDay, setSelectedDay] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [draggedDish, setDraggedDish] = useState(null);
    const [sourceDay, setSourceDay] = useState('');

    const socket = socketIOClient('http://localhost:5000', { withCredentials: true });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            const userId = decodedPayload.id;
            setUserId(userId);
            fetchDishes(userId);
        }

        socket.on('newDish', (newDish) => {
            setDishes(prev => ({
                ...prev,
                [newDish.day]: [...(prev[newDish.day] || []), newDish]
            }));
        });

        // socket.on('dishUpdated', (updatedDish) => {
        //     setDishes(prev => {
        //         const updatedDishes = { ...prev };
        //         const oldDay = Object.keys(updatedDishes).find(day => updatedDishes[day].some(dish => dish._id === updatedDish._id));
        //         if (oldDay) {
        //             updatedDishes[oldDay] = updatedDishes[oldDay].filter(dish => dish._id !== updatedDish._id);
        //         }
        //         updatedDishes[updatedDish.day].push(updatedDish);
        //         return updatedDishes;
        //     });
        // });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchDishes = async (userId) => {
        const result = await axios.get(`http://localhost:5000/dishes/${userId}`);
        const dishesByDay = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
        };

        result.data.forEach(dish => {
            dishesByDay[dish.day].push(dish);
        });
        setDishes(dishesByDay);
    };

    const handleDragStart = (event, dish, day) => {
        setDraggedDish(dish);
        setSourceDay(day);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (event, targetDay) => {
        event.preventDefault();
        const newDishes = { ...dishes };
        newDishes[sourceDay] = newDishes[sourceDay].filter(dish => dish._id !== draggedDish._id);
        newDishes[targetDay].push(draggedDish);
        setDishes(newDishes);
        
        socket.emit('updateDish', { id: draggedDish._id, day: targetDay });

        setDraggedDish(null);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleAddDish = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', dishName);
        formData.append('image', image);
        formData.append('day', selectedDay);
        formData.append('userId', userId);

        try {
            const response = await axios.post('http://localhost:5000/dishes', formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });

            const newDish = response.data;
            setDishes(prevDishes => ({
                ...prevDishes,
                [newDish.day]: [...(prevDishes[newDish.day] || []), newDish]
            }));

            setShowForm(false);
            setDishName('');
            setImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error adding dish:', error);
            toast.error(error.response.data,{
                position: "top-right",
                autoClose: 3000, 
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            }); 
        }
    };

    return (
        <div>
            <button onClick={() => setShowForm(true)}>Add Dish</button>
            {showForm && (
                <div className='add-dish'>
                <form onSubmit={handleAddDish}>
                    <input type="text" placeholder="Dish name" onChange={(e) => setDishName(e.target.value)} required />
                    <input
                        type="file"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            setImage(file);
                            setImagePreview(URL.createObjectURL(file));
                        }}
                        required
                    />
                    {imagePreview && (
                        <div>
                            <h4>Image Preview:</h4>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: '5px', marginBottom: '10px' }} />
                        </div>
                    )}
                    <select onChange={(e) => setSelectedDay(e.target.value)} required>
                        <option value="">Select a day</option>
                        {days.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <button type="submit">Submit</button>
                </form>
                <ToastContainer /> 

                </div>
            )}

            <div className="container">
                {days.map((day) => (
                    <div
                        key={day}
                        className="day-column"
                        onDrop={(e) => handleDrop(e, day)}
                        onDragOver={handleDragOver}
                    >
                        <h2>{day}</h2>
                        {dishes[day].map((dish) => (
                            <div
                                key={dish._id}
                                className="dish-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, dish, day)}
                            >
                                <img src={dish.imageUrl} />
                                <span>{dish.name}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DishColumns;
