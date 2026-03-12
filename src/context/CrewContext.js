import React, { createContext, useContext, useState } from 'react';

const CrewContext = createContext();

export const useCrew = () => useContext(CrewContext);

export const CrewProvider = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openCrewModal = () => setIsModalVisible(true);
  const closeCrewModal = () => setIsModalVisible(false);

  return (
    <CrewContext.Provider value={{ isModalVisible, openCrewModal, closeCrewModal }}>
      {children}
    </CrewContext.Provider>
  );
};
