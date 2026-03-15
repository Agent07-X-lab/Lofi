import React, { useState } from "react";
import {
  listAdd,
  listToggleComplete,
  listRemove,
} from "../../store/slice/todoListSlice";
import "./styles.scss";
import { RootState, useAppDispatch, useAppSelector } from "../../store/store";

const TodoList = () => {
  const dispatch = useAppDispatch();
  const [list, setList] = useState<string>("");

  const data = useAppSelector((state: RootState) => state.todoList);
  const { todoList, repeat } = data;

  const submitHandler = (e: any) => {
    e.preventDefault();
    if (!list.trim()) return;
    dispatch(listAdd({ name: list.trim(), complete: false }));
    setList("");
  };

  const handleDelete = (item: any) => {
    dispatch(listRemove(item));
  };

  const handleToggleComplete = (item: any) => {
    dispatch(listToggleComplete(item));
  };

  return (
    <div className='todo-container'>
      <form className='todo-form' onSubmit={submitHandler}>
        <div className="input-group">
          <input
            type='text'
            value={list}
            onChange={(e) => setList(e.target.value)}
            placeholder='What do you need to do?'
            required
            className="todo-input"
          />
          <button type='submit' className="todo-add-btn">
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </form>
      
      {repeat && (
        <div className="todo-alert">
          <i className="fas fa-exclamation-circle"></i> This note is already added
        </div>
      )}

      <div className='todo-list'>
        {todoList.length > 0 ? (
          todoList.map((listItem: any) => (
            <div
              className={`todo-item ${listItem.complete ? "completed" : ""}`}
              key={listItem.name}
            >
              <div 
                className="todo-content"
                onClick={() => handleToggleComplete(listItem.name)}
              >
                <div className={`checkbox ${listItem.complete ? "checked" : ""}`}>
                  {listItem.complete && <i className='fas fa-check'></i>}
                </div>
                <span className="todo-text">{listItem.name}</span>
              </div>
              <button
                className="todo-delete-btn"
                onClick={() => handleDelete(listItem.name)}
                title="Delete task"
              >
                <i className='fas fa-trash-alt'></i>
              </button>
            </div>
          ))
        ) : (
          <div className='todo-empty'>
            <i className="fas fa-clipboard-list"></i>
            <p>Nothing to do yet. Add a task to stay focused!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
