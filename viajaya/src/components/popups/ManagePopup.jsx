/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { postPopup, putPopup } from '../../redux/actions/actions';

const ManagePopup = ({ existingPopup }) => {
  const [content, setContent] = useState(existingPopup ? existingPopup.content : '');
  const [isActive, setIsActive] = useState(existingPopup ? existingPopup.isActive : false);
  const dispatch = useDispatch();

  const handleSubmit = () => {
    const popupData = { content, isActive };

    if (existingPopup) {
      dispatch(putPopup(existingPopup.id, popupData));
    } else {
      dispatch(postPopup(popupData));
    }
  };

  return (
    <div>
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        placeholder="Enter popup content here"
      />
      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={() => setIsActive(!isActive)}
        />
        Active
      </label>
      <button onClick={handleSubmit}>Save</button>
    </div>
  );
};

export default ManagePopup;
