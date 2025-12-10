import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}  // Start: Transparent & slightly down
      animate={{ opacity: 1, y: 0 }}   // End: Visible & in place
      exit={{ opacity: 0, y: -20 }}    // Exit: Transparent & slightly up
      transition={{ duration: 0.3, ease: "easeInOut" }} // Speed: 0.3s
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;