import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { injectIntl, IntlProvider } from 'react-intl';
import makeStyles from '@mui/styles/makeStyles';

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';

import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';

import { buildTheme } from '../utils/styles/theme/theme';
import { Banner } from './banner/banner';
import { Cards } from './cards/cards';

import { styles } from './profile_styles';

import en from '../i18n/en.json';
import '../styles/tailwind.css';

import { technologiesInitialState, technologiesReducer } from '../store/technologies/technologies_reducer';
import { DeveloperProfileContext, StaticDataContext, StoreContext } from '../utils/context/contexts';
import { mergeOmitNull } from '../utils/data_utils';
import { SIDES } from './commons/profile_card/profile_card_side/side';

console.log('coucou slick');

if (!Intl.PluralRules) {
    // eslint-disable-next-line global-require
    require('@formatjs/intl-pluralrules/polyfill');
    // eslint-disable-next-line global-require
    require('@formatjs/intl-pluralrules/locale-data/en');
    // eslint-disable-next-line global-require
    require('@formatjs/intl-pluralrules/locale-data/fr');
}

const messages = {
    en
};
const useStyles = makeStyles(styles);

const DEFAULT_OPTIONS = {
    locale: 'en',
    customization: {
        imageHeader: {
            url: 'https://cdn.filestackcontent.com/8I2wVnCRTFxypXRYLRsp',
            alt: 'Default Banner'
        }
    },
    maxCardsPerRow: null,
    showContactInfos: false
};

const DEFAULT_OBJECT = {};
const DEFAULT_FUNCTION = () => {};

const DeveloperProfileComponent = ({
    data: originalData = DEFAULT_OBJECT,
    options,
    mode,
    onEdit: onEditProps = DEFAULT_FUNCTION,
    onIsEditingChanged = DEFAULT_FUNCTION,
    onCustomizationChanged,
    onFilesUpload,
    additionalNodes,
    classes: receivedGlobalClasses = {}
}) => {
    const classes = useStyles(styles);
    const { apiKeys, endpoints } = options;
    const [isEditing, setIsEditing] = useState(false);
    const onEdit = useCallback(
        (newData) => {
            if (typeof onEditProps === 'function') {
                onEditProps(newData);
            }
        },
        [onEditProps]
    );
    const setIsEditingWithCallback = useCallback(
        (newValue) => {
            setIsEditing(newValue);
            onIsEditingChanged(newValue);
        },
        [onIsEditingChanged, setIsEditing]
    );
    const store = {
        technologies: useReducer(technologiesReducer, technologiesInitialState)
    };
    const staticContext = useMemo(
        () => ({
            apiKeys: { giphy: apiKeys?.giphy, unsplash: apiKeys?.unsplash },
            endpoints,
            additionalNodes,
            receivedGlobalClasses,
            customization: options?.customization,
            options: {
                showContactInfos: options?.showContactInfos,
                maxSkills: options?.maxSkills,
                disableSortableExperience: options?.disableSortableExperience
            }
        }),
        [apiKeys, endpoints, additionalNodes, receivedGlobalClasses, JSON.stringify(options?.customization)]
    );

    const data = useMemo(() => originalData, [JSON.stringify(originalData)]);

    const context = useMemo(
        () => ({
            data,
            isEditing,
            setIsEditing: setIsEditingWithCallback,
            onEdit,
            onCustomizationChanged,
            onFilesUpload,
            mode
        }),
        [data, isEditing, onEdit, mode, onCustomizationChanged, onFilesUpload]
    );

    const side = useMemo(() => (isEditing && SIDES.BACK) || options?.side, [options, isEditing]);

    return (
        <div className={classes.container}>
            <StaticDataContext.Provider value={staticContext}>
                <StoreContext.Provider value={store}>
                    <DeveloperProfileContext.Provider value={context}>
                        <Banner
                            customizationOptions={options.customization}
                            onCustomizationChanged={onCustomizationChanged}
                        />
                        {additionalNodes?.beforeCards}
                        <Cards
                            cardsOrder={options.customization?.cardsOrder}
                            maxCardsPerRow={options?.maxCardsPerRow}
                            side={side}
                        />
                    </DeveloperProfileContext.Provider>
                </StoreContext.Provider>
            </StaticDataContext.Provider>
        </div>
    );
};

const WithProvidersDeveloperProfile = ({
    data,
    onEdit,
    onCustomizationChanged,
    onIsEditingChanged,
    options = {},
    mode = 'readOnly',
    additionalNodes,
    classes,
    onFilesUpload,
    intl: parentIntl
}) => {
    const mergedOptions = useMemo(
        () => mergeWith(cloneDeep(DEFAULT_OPTIONS), JSON.parse(JSON.stringify(options || {})), mergeOmitNull),
        [JSON.stringify(options)]
    );

    const { locale, customization } = mergedOptions;
    const builtTheme = useMemo(() => buildTheme(customization?.theme), [customization?.theme]);

    const providerMessages = useMemo(
        () => ({ ...(parentIntl?.messages || {}), ...(messages[locale] || messages.en) }),
        [parentIntl, locale]
    );

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={builtTheme}>
                <IntlProvider locale={locale} messages={providerMessages} defaultLocale={locale}>
                    <DeveloperProfileComponent
                        data={data}
                        mode={mode}
                        onEdit={onEdit}
                        onCustomizationChanged={onCustomizationChanged}
                        onIsEditingChanged={onIsEditingChanged}
                        options={mergedOptions}
                        additionalNodes={additionalNodes}
                        onFilesUpload={onFilesUpload}
                        classes={classes}
                    />
                </IntlProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export const DeveloperProfile = injectIntl(WithProvidersDeveloperProfile, { enforceContext: false });
