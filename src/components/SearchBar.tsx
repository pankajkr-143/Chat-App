import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search users, messages..." 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        isFocused && styles.searchContainerFocused,
      ]}>
        <View style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  searchContainerFocused: {
    borderColor: '#25D366',
    backgroundColor: '#ffffff',
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchIconText: {
    fontSize: 16,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E9ECEF',
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