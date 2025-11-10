import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import Signup from './Signup';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, '/');
      setIsAuthenticated(true);
    } else if (localStorage.getItem('token')) {
      setIsAuthenticated(true);
      fetchTodos();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('token')) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  const fetchTodos = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/todos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTodos(res.data);
  };

  const addTodo = async () => {
    if (input.trim()) {
      const token = localStorage.getItem('token');
      await axios.post('/api/todos', { 
        text: input,
        dueDate: dueDate || null,
        dueTime: dueTime || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInput('');
      setDueDate('');
      setDueTime('');
      fetchTodos();
    }
  };

  const updateTodo = async (id, updates) => {
    const token = localStorage.getItem('token');
    await axios.put(`/api/todos/${id}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    const token = localStorage.getItem('token');
    await axios.delete(`/api/todos/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTodos();
  };

  const startEdit = (todo) => {
    setEditId(todo._id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    if (editText.trim()) {
      await updateTodo(id, { text: editText });
      setEditId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setTodos([]);
  };

  if (!isAuthenticated) {
    return showLogin ? (
      <Login 
        onLogin={() => setIsAuthenticated(true)} 
        onSwitchToSignup={() => setShowLogin(false)}
      />
    ) : (
      <Signup 
        onSignup={() => setIsAuthenticated(true)} 
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>ToDo List</h1>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
      <div className="input-section">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
          className="task-input"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="date-input"
        />
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="time-input"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => updateTodo(todo._id, { completed: !todo.completed })}
            />
            <div className="todo-text">
              {editId === todo._id ? (
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit(todo._id)}
                  onBlur={() => saveEdit(todo._id)}
                  autoFocus
                />
              ) : (
                <div>
                  <span onDoubleClick={() => startEdit(todo)}>{todo.text}</span>
                  {(todo.dueDate || todo.dueTime) && (
                    <div className="due-info">
                      {todo.dueDate && <span>📅 {new Date(todo.dueDate).toLocaleDateString()}</span>}
                      {todo.dueTime && <span>🕐 {todo.dueTime}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="btn-edit" onClick={() => editId === todo._id ? saveEdit(todo._id) : startEdit(todo)}>
              {editId === todo._id ? 'Save' : 'Edit'}
            </button>
            <button className="btn-delete" onClick={() => deleteTodo(todo._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
