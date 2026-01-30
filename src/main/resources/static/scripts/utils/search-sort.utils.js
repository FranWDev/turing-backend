export const SearchSortUtils = {

  filterItems(items, searchTerm, searchFields = []) {
    if (!searchTerm || searchTerm.trim() === '') {
      return items;
    }

    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = this.getNestedValue(item, field);
        return value && value.toString().toLowerCase().includes(term);
      });
    });
  },

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  },

  sortItems(items, sortBy, sortDirection = 'asc', calculatedFields = {}) {
    const sorted = [...items].sort((a, b) => {
      let valueA, valueB;

      if (calculatedFields[sortBy]) {
        valueA = calculatedFields[sortBy](a);
        valueB = calculatedFields[sortBy](b);
      } else {
        valueA = this.getNestedValue(a, sortBy);
        valueB = this.getNestedValue(b, sortBy);
      }

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB, 'es')
          : valueB.localeCompare(valueA, 'es');
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      return sortDirection === 'asc'
        ? strA.localeCompare(strB, 'es')
        : strB.localeCompare(strA, 'es');
    });

    return sorted;
  },

  setupSortHeaders(tableElement, onSort) {
    const headers = tableElement.querySelectorAll('th[data-sortable]');
    const headersArray = Array.from(headers);

    headersArray.forEach(header => {
      header.style.cursor = 'pointer';
      header.style.userSelect = 'none';
      
      header.addEventListener('click', () => {
        const sortBy = header.dataset.sortable;
        const currentDirection = header.dataset.sortDirection || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

        headersArray.forEach(h => {
          h.dataset.sortDirection = 'asc';
          h.classList.remove('sort-asc', 'sort-desc');
        });

        header.dataset.sortDirection = newDirection;
        header.classList.add(`sort-${newDirection}`);

        onSort(sortBy, newDirection);
      });
    });
  },

  createSearchInput(options = {}) {
    const {
      placeholder = 'Buscar...',
      onChange = () => {},
      className = 'search-input-wrapper'
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = className;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.className = 'search-input';

    input.addEventListener('input', (e) => {
      onChange(e.target.value);
    });

    wrapper.appendChild(input);

    return wrapper;
  }
};
