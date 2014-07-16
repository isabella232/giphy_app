(function() {
  return {
    defaultState: "loading",
    events: {
      "app.activated": function() {
        this.key = this._parameter("key") || this.resources.KEY;
        this.tag = this._parameter("tag") || this.resources.TAG;
        this.store("search", '');

        if(this.store("nsfw") == this.resources.NSFW) {
          this.ajax("getAccountSettings");
        }
        else {
          this.switchTo("nsfw");
        }
      },

      "click .nsfw > button": function(event) {
        var spinner = this.renderTemplate("loading");

        this.$(".nsfw").replaceWith(spinner);
        this.store("nsfw", this.resources.NSFW);
        this.ajax("getAccountSettings");

        return false;
      },

      "click .giphy:not('.clicked')": function(event) {
        var $this = this.$(event.currentTarget);
        var $image = this.$("img", $this);
        var comment = this.comment();
        var format;

        if (comment.text()) {
          format = "%@\n![%@](%@)";
        }
        else {
          format = "%@![%@](%@)";
        }

        var altText = this.store("search").replace(/\[|\]/g, '');
        var text = helpers.fmt(format, comment.text(), altText, $image.attr("src"));
        var html = this.I18n.t("image.clicked");

        this.comment().text(text);
        this.$("strong", $this).html(html);
        $this.addClass("clicked");
      },

      "submit": function(event) {
        var name;
        var text = this.$("input[type='search']").val();
        var spinner = this.renderTemplate("loading");

        this.$(".error, .giphy").replaceWith(spinner);

        if (text) {
          this.store("search", text);
        }
        else {
          this.store("search", '');
          text = '#' + this.tag;
        }

        if (text.indexOf('#') === 0) {
          name = "getRandomGIF";
          text = text.substring(1);
        }
        else {
          name = "getTranslateGIF";
        }

        this.ajax(name, text);

        return false;
      }
    },
    requests: {
      getAccountSettings: function() {
        return {
          success: function(json) {
            if (json.settings.active_features.markdown) {
              this.ajax("getRandomGIF", this.tag);
            }
            else {
              var admin = (this.currentUser().role() == "admin");

              this.switchTo("403", {
                admin: admin
              });
            }
          },
          url: this.resources.URI_ACCOUNT_SETTINGS
        };
      },

      getGIF: function(id) {
        return {
          data: {
            api_key: this.key
          },
          dataType: "json",
          error: this._error,
          success: function(json) {
            var image = json.data.images.fixed_height;
            var search = this.store("search");

            this.switchTo("image", {
              height: image.height,
              source: image.url,
              width: image.width
            });
            this.$("input[type='search']").val(search);
          },
          url: helpers.fmt(this.resources.URL, id)
        };
      },

      getRandomGIF: function(tag) {
        return {
          data: {
            api_key: this.key,
            tag: tag
          },
          dataType: "json",
          error: this._error,
          success: function(json) {
            this.ajax("getGIF", json.data.id);
          },
          url: helpers.fmt(this.resources.URL, "random")
        };
      },

      getTranslateGIF: function(term) {
        return {
          data: {
            api_key: this.key,
            s: term
          },
          dataType: "json",
          error: this._error,
          success: function(json) {
            this.ajax("getGIF", json.data.id);
          },
          url: helpers.fmt(this.resources.URL, "translate")
        };
      }
    },

    resources: {
      KEY: "iEVMAJcGNV81q",
      NSFW: "accepted",
      TAG: "reaction",
      URI_ACCOUNT_SETTINGS: "/api/v2/account/settings.json",
      URL: "http://api.giphy.com/v1/gifs/%@"
    },

    _error: function() {
        var error = this.renderTemplate("404", {
          search: this.store("search")
        });

        this.$(".spinner").replaceWith(error);
    },

    _parameter: function(name) {
      var retVal = this.setting(name);

      if (retVal) {
        retVal = retVal.replace(/\\n/g, '');  // Fix for '\n' being set on blank parameters.
      }

      return retVal;
    }
  };
}());
