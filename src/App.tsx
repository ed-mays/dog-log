import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useAppStore } from '@store/store';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from './featureFlags/useFeatureFlag.tsx';

function App() {
  const { i18n } = useTranslation();
  const store = useAppStore();
  const showCountButton = useFeatureFlag('test_show_count_button');
  const appTitle = import.meta.env.VITE_APP_TITLE;
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{appTitle}</h1>
      <div className="card">
        {showCountButton && (
          <button onClick={() => store.increment()}>
            {i18n.t('home:countButton.countText')} {store.count}
          </button>
        )}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
