/**
 * Shared Stylelint config for every workspace (apps and packages).
 * Root .stylelintrc.json extends this, so one rule set covers all SCSS.
 */
const config = {
  "extends": [
    "stylelint-config-standard-scss",
    "stylelint-config-clean-order"
  ],
  "plugins": [
    "stylelint-selector-bem-pattern",
    "stylelint-declaration-strict-value",
    "./max-lines.js"
  ],
  "rules": {
    "plugin/selector-bem-pattern": {
      "componentName": "[a-z0-9-]+",
      "componentSelectors": {
        "initial": String.raw`^\.{componentName}(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$`
      },
      "ignoreSelectors": [
        String.raw`^\.section$`,
        String.raw`^\.active$`,
        String.raw`^\.fluid-container$`,
        String.raw`^\.container$`
      ]
    },
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": [
          "global"
        ]
      }
    ],
    "scale-unlimited/declaration-strict-value": [
      [
        "/color/",
        "background-color",
        "border-color",
        "font-size",
        "letter-spacing",
        "/^(margin|padding)(-.+)?$/",
        "gap",
        "row-gap",
        "column-gap",
        "/^(inset|top|right|bottom|left)$/",
        "font-weight",
        "line-height"
      ],
      {
        "ignoreValues": {
          "": [
            "transparent",
            "inherit",
            "currentColor",
            "currentcolor",
            "initial",
            "none",
            "unset"
          ],
          "font-size": [
            "inherit",
            "0"
          ],
          "letter-spacing": [
            "inherit",
            "normal",
            "0"
          ],
          "/^(margin|padding)(-.+)?$/": [
            "0",
            "auto",
            "inherit"
          ],
          "/^(inset|top|right|bottom|left)$/": [
            "0",
            "auto",
            "50%",
            "100%",
            "inherit"
          ],
          "/gap$/": [
            "0",
            "normal"
          ],
          "font-weight": [
            "inherit",
            "normal"
          ],
          "line-height": [
            "1",
            "normal",
            "inherit"
          ]
        },
        "expandShorthand": false
      }
    ],
    "selector-class-pattern": null,
    "scss/at-mixin-pattern": "^[a-z][a-zA-Z0-9-]*$",
    "scss/dollar-variable-pattern": "^[a-z][a-zA-Z0-9-]*$",
    "color-no-hex": true,
    "declaration-property-value-disallowed-list": {
      "z-index": [
        String.raw`/^-?([3-9]|\d{2,})$/`
      ],
      "/^border(-[a-z]+)*-radius$/": [
        String.raw`/(^|[\s(])([3-9]|\d{2,})(\.\d+)?px/`
      ],
      "/^(backdrop-filter|filter)$/": [
        String.raw`/blur\(\s*\d+(\.\d+)?px/`
      ],
      "/^(transition|transition-duration)$/": [
        String.raw`/(^|[\s,(])\d*\.?\d+m?s\b/`
      ]
    },
    "function-disallowed-list": [
      [
        "rgb",
        "rgba",
        "hsl",
        "hsla"
      ],
      {
        "message": "Use color-mix(in srgb, #{$token} N%, transparent): rgba() over a var()-based token compiles to invalid CSS."
      }
    ],
    "dival/max-lines": 220
  }
};

export default config;
