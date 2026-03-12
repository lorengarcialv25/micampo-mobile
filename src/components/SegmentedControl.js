import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SegmentedControl = ({ values, selectedIndex, onChange }) => {
  return (
    <View style={styles.container}>
      {values.map((value, index) => {
        const isActive = selectedIndex === index;
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.segment,
              isActive && styles.segmentActive
            ]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              isActive && styles.segmentTextActive
            ]}>
              {value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f1',
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8898aa',
  },
  segmentTextActive: {
    color: '#2e7d32',
  },
});

export default SegmentedControl;
