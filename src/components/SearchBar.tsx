import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value,
  onChangeText,
  onSearch, 
  placeholder = 'Search...', 
  autoFocus = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setSearchQuery(text);
    }
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleClear = () => {
    const emptyText = '';
    if (onChangeText) {
      onChangeText(emptyText);
    } else {
      setSearchQuery(emptyText);
    }
    if (onSearch) {
      onSearch(emptyText);
    }
    Keyboard.dismiss();
  };

  const displayValue = value !== undefined ? value : searchQuery;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={displayValue}
          onChangeText={handleSearch}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
        />
        {displayValue.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 4,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default SearchBar; 