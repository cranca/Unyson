(function(fwe, _, data) {
	fwe.one('fw-builder:' + 'layout-builder' + ':register-items', function(builder) {
		var LayoutBuilderColumnItem,
			LayoutBuilderColumnItemView;

		LayoutBuilderColumnItemView = builder.classes.ItemView.extend({
			initialize: function() {
				this.widthChangerView = new FwBuilderComponents.ItemView.WidthChanger({
					model: this.model,
					view: this,
					widths: [
						{
							text: '1/5',
							value: '1-5',
							itemViewClass: 'lb-column-1-5'
						},
						{
							text: '1/4',
							value: '1-4',
							itemViewClass: 'lb-column-1-4'
						},
						{
							text: '1/3',
							value: '1-3',
							itemViewClass: 'lb-column-1-3'
						},
						{
							text: '1/2',
							value: '1-2',
							itemViewClass: 'lb-column-1-2'
						},
						{
							text: '2/3',
							value: '2-3',
							itemViewClass: 'lb-column-2-3'
						},
						{
							text: '3/4',
							value: '3-4',
							itemViewClass: 'lb-column-3-4'
						},
						{
							text: '1/1',
							value: '1-1',
							itemViewClass: 'lb-column-1-1'
						}
					],
					modelAttribute: 'subtype'
				});
				this.defaultInitialize();
			},
			template: _.template(
				'<div class="lb-item-type-column lb-item">' +
					'<div class="panel fw-row">' +
						'<div class="panel-left fw-col-xs-6">' +
							'<div class="width-changer"></div>' +
						'</div>' +
						'<div class="panel-right fw-col-xs-6">' +
							'<div class="controls">' +
								'<i class="dashicons dashicons-admin-page column-item-clone"></i>' +
								'<i class="dashicons dashicons-no column-item-delete"></i>' +
							'</div>' +
						'</div>' +
					'</div>' +
					'<div class="builder-items"></div>' +
				'</div>'
			),
			render: function() {
				this.defaultRender();

				this.$('.width-changer').append(this.widthChangerView.$el);
				this.widthChangerView.delegateEvents();
			},
			events: {
				'click .column-item-clone': 'cloneItem',
				'click .column-item-delete': 'removeItem'
			},
			cloneItem: function() {
				var index = this.model.collection.indexOf(this.model),
					attributes = this.model.toJSON(),
					_items = attributes['_items'],
					clonedColumn;

				delete attributes['_items'];

				clonedColumn = new LayoutBuilderColumnItem(attributes);
				this.model.collection.add(clonedColumn, {at: index + 1});
				clonedColumn.get('_items').reset(_items);
			},
			removeItem: function() {
				this.remove();
				this.model.collection.remove(this.model);
			}
		});

		LayoutBuilderColumnItem = builder.classes.Item.extend({
			defaults: {
				type: 'column'
			},
			restrictedTypes: data.restrictedTypes,
			initialize: function(atts, opts) {
				var subtype = this.get('subtype') || opts.$thumb.find('.item-data').attr('data-subtype');

				if (!this.get('subtype')) {
					this.set('subtype', subtype);
				}

				this.view = new LayoutBuilderColumnItemView({
					id: 'layout-builder-item-'+ this.cid,
					model: this
				});

				this.defaultInitialize();
			},
			allowIncomingType: function(type) {
				return _.indexOf(this.restrictedTypes, type) === -1;
			}
		});


		var setFirstRowColumns = (function() {
			var Fraction = (function() {
				var f = function(numerator, denominator) {
					this.n = numerator;
					this.d = denominator;
				};

				f.createFromString = function(fractionString) {
					var splitted = fractionString.split('-');
					return new f(splitted[0], splitted[1]).simplify();
				};

				f.prototype.simplify = function() {
					var euclid = function(a, b) {
							if (b === 0) return a;
							else return euclid(b, a % b);
						},
						gcd = euclid(this.n, this.d);
					this.n /= gcd;
					this.d /= gcd;
					return this;
				};

				f.prototype.add = function(f) {
					this.n = this.n * f.d + this.d * f.n;
					this.d = this.d * f.d;
					return this.simplify();
				};

				f.prototype.toNumber = function() {
					return this.n / this.d;
				};

				return f;
			})();

			return function(items) {
				var type = 'column',
					columnSumm;

				items.each(function(item, index, list) {

					if (item.get('type') === type) {
						item.unset('firstInRow', {silent: true});

						// checking if the previous element exists
						if (!list[index - 1]) {
							item.set('firstInRow', true, {silent: true});
							columnSumm = Fraction.createFromString(item.get('subtype'));
							return;
						}

						// checking if the previous element is not a column
						if (list[index - 1].get('type') !== type) {
							item.set('firstInRow', true, {silent: true});
							columnSumm = Fraction.createFromString(item.get('subtype'));
							return;
						}

						// if here then the previos is also a column
						// summ it and see if new row
						columnSumm.add(Fraction.createFromString(item.get('subtype')));
						if (columnSumm.toNumber() > 1) {
							item.set('firstInRow', true, {silent: true});
							columnSumm = Fraction.createFromString(item.get('subtype'));
						}
					}

				});
			};
		})();

		builder.rootItems.on('change add remove reset', function() {
			setFirstRowColumns(builder.rootItems);
		});

		builder.registerItemClass(LayoutBuilderColumnItem);
	});
})(fwEvents, _, layout_builder_item_type_column_data);
