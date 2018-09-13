import capitalize from 'capitalize';

new Vue({
  el: '#app',

  data: {
    token: null,
    category: null,
    filter: null,
    categories: [],
    entries: [],
    requests: {
      left: 0,
      total: 0,
      reset: 0
    },
    loading: false,
    interval: -1,
    resetTimestamp: '',
    error: null
  },
  computed: {
    filteredEntries() {
      const self = this;
      if (this.entries.length === 0) return [];
      return this.entries.entries.filter(entry => entry.name.indexOf(self.filter) !== -1);
    },
    selectedCategory() {
      return this.categories.find(el => el.id === this.category);
    },
    shouldShowList() {
      return this.error === null && this.entries.length > 0;
    },
    loadingText() {
      if (this.error) return this.error.toString();
      return 'Loading...';
    }
  },

  methods: {
    transformName(name) {
      return capitalize.words(name)
        .replace('.Json', '')
        .split('-').join(' / ');
    },
    transformResponse(data) {
      return data.map(el => {
        return {
          id: el.name,
          name: this.transformName(el.name),
          url: el.download_url
        };
      });
    },
    loadCategories() {
      const url = 'https://api.github.com/repos/axelrindle/collections/contents/data?ref=convert-data';
      const self = this;
      this.loading = true;
      this.error = null;
      axios.get(url)
        .then(response => {
          self.requests = {
            left: response.headers['x-ratelimit-remaining'],
            total: response.headers['x-ratelimit-limit'],
            reset: response.headers['x-ratelimit-reset']
          }
          self.categories = self.transformResponse(response.data);
          return self.loadEntries();
        })
        .catch(err => {
          console.error(err);
          self.error = err;
        });
    },
    loadEntries() {
      const self = this;
      this.loading = true;
      axios.get(this.selectedCategory.url)
      this.error = null;
        .then(response => {
          self.loading = false;
          this.entries = response.data;
        })
        .catch(err => {
          console.error(err);
          self.error = err;
        });
    },
    addApiToken() {
      const def = axios.defaults.headers.common['Authorization'] || '';
      const token = prompt('Enter your Personal Access Token:', def.replace('token ', ''));
      if (token !== null) {
        if (token !== '') {
          axios.defaults.headers.common['Authorization'] = 'token ' + token;
          localStorage.setItem('token', token);
          this.loadCategories();
        } else {
          delete axios.defaults.headers.common['Authorization'];
          localStorage.removeItem('token');
          this.$forceUpdate();
          this.loadCategories();
        }
      }
    },
    apiButtonText() {
      return axios.defaults.headers.common['Authorization'] === undefined ? 'Add API token' : 'Change API token';
    }
  },

  watch: {
    category() {
      localStorage.setItem('category', this.category);
    },
    filter() {
      localStorage.setItem('filter', this.filter);
    }
  },

  created() {
    // Load data from localStorage
    this.category = localStorage.getItem('category') || 'node.js.json';
    this.filter = localStorage.getItem('filter') || '';

    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = 'token ' + token;

    // Initially refresh
    this.loadCategories();
    const self = this;
    this.interval = setInterval(() => {
      const now = moment();
      const future = moment.unix(self.requests.reset);
      const duration = moment.duration(now.diff(future));
      self.resetTimestamp = duration.humanize();
    }, 1000);
  }
});
