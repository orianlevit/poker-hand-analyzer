import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children?: React.ReactNode;
  tableContent: React.ReactNode;
  actionContent: React.ReactNode;
  bottomNavigation?: React.ReactNode;
}

export default function PokerScreenLayout({ 
  children,
  tableContent,
  actionContent,
  bottomNavigation
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Table Section */}
      <View style={styles.tableSection}>
        {tableContent}
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <View style={styles.actionContent}>
          {actionContent}
        </View>
        {bottomNavigation}
      </View>

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tableSection: {
    height: '55%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  actionSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
}); 